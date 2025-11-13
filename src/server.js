const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const WebSocket = require('ws');
require('dotenv').config();

const { testConnection } = require('./config/database');
const mqttService = require('./services/mqttService');

// Import routes
const trashBinRoutes = require('./routes/trashBinRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const sensorRoutes = require('./routes/sensorRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const alertRoutes = require('./routes/alertRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;

// Rate limiting (relaxed for development)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 1 * 60 * 1000, // 1 minute window
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10000, // Very high limit for development
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  skip: (req) => process.env.NODE_ENV === 'development' // Skip rate limiting in development
});

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Gzip compression
app.use(morgan('combined')); // Logging
app.use(limiter); // Rate limiting
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3005',
    'http://localhost:3006',
    'https://wastewatcher.netlify.app',
    'https://wastewatcher.vercel.app',
    process.env.FRONTEND_URL || 'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// WebSocket setup
const wss = new WebSocket.Server({ server, path: '/ws' });

wss.on('connection', (ws) => {
  console.log('🔌 New WebSocket client connected');

  // Add this WebSocket to MQTT subscribers
  const handleMQTTData = (data) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  };

  mqttService.addSubscriber(handleMQTTData);

  ws.on('close', () => {
    console.log('🔌 WebSocket client disconnected');
    mqttService.removeSubscriber(handleMQTTData);
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
    mqttService.removeSubscriber(handleMQTTData);
  });

  // Send initial connection confirmation
  ws.send(JSON.stringify({ type: 'connection', status: 'connected' }));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test endpoint for publishing MQTT data
app.post('/api/test/publish', (req, res) => {
  const { sensor, value } = req.body;

  if (!sensor || value === undefined) {
    return res.status(400).json({
      error: 'Missing required fields: sensor and value'
    });
  }

  const data = {
    sensor,
    value: parseFloat(value),
    timestamp: new Date().toISOString()
  };

  mqttService.publish(data);

  res.json({
    message: 'Data published to MQTT',
    data
  });
});

// Test endpoint to simulate sensor data (useful when MQTT broker is not available)
app.post('/api/test/simulate', (req, res) => {
  const data = {
    sensor: 'sensor1',
    value: Math.random() * 100,
    timestamp: new Date().toISOString()
  };

  // Directly notify WebSocket clients
  mqttService.notifySubscribers(data);

  setTimeout(() => {
    const data2 = {
      sensor: 'sensor2',
      value: Math.random() * 100,
      timestamp: new Date().toISOString()
    };
    mqttService.notifySubscribers(data2);
  }, 500);

  res.json({
    message: 'Simulated data sent to WebSocket clients',
    data: [data, { sensor: 'sensor2', value: 'random', timestamp: 'delayed' }]
  });
});

// Start continuous simulation (for testing without needing to manually trigger)
let simulationInterval = null;

app.post('/api/test/start-simulation', (req, res) => {
  if (simulationInterval) {
    return res.json({ message: 'Simulation already running' });
  }

  simulationInterval = setInterval(() => {
    // Simulate sensor 1
    const data1 = {
      sensor: 'sensor1',
      value: 20 + Math.random() * 60, // Random between 20-80
      timestamp: new Date().toISOString()
    };
    mqttService.storeData(data1); // Store for HTTP polling
    mqttService.notifySubscribers(data1); // Notify WebSocket (if any)

    // Simulate sensor 2 with slight delay
    setTimeout(() => {
      const data2 = {
        sensor: 'sensor2',
        value: 10 + Math.random() * 40, // Random between 10-50
        timestamp: new Date().toISOString()
      };
      mqttService.storeData(data2); // Store for HTTP polling
      mqttService.notifySubscribers(data2); // Notify WebSocket (if any)
    }, 200);
  }, 1000); // Every second

  res.json({ message: 'Simulation started - data will be sent every second' });
});

app.post('/api/test/stop-simulation', (req, res) => {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
    res.json({ message: 'Simulation stopped' });
  } else {
    res.json({ message: 'No simulation running' });
  }
});

// MQTT-only endpoints (for polling instead of WebSocket)
app.get('/api/sensor/data', (req, res) => {
  const data = mqttService.getLatestData();
  res.json({
    timestamp: new Date().toISOString(),
    locations: data
  });
});

app.get('/api/sensor/data/:location', (req, res) => {
  const location = req.params.location;
  const data = mqttService.getLatestData(location);
  res.json({
    location,
    timestamp: new Date().toISOString(),
    data
  });
});

// Waste bin specific endpoints
app.get('/api/waste-bins', (req, res) => {
  const data = mqttService.getLatestData();
  res.json({
    timestamp: new Date().toISOString(),
    locations: Object.keys(data),
    data
  });
});

app.get('/api/waste-bins/:location', (req, res) => {
  const location = req.params.location;
  const data = mqttService.getLatestData(location);

  if (!data || Object.keys(data).length === 0) {
    return res.status(404).json({
      error: `No data found for location: ${location}`,
      availableLocations: Object.keys(mqttService.getLatestData())
    });
  }

  res.json({
    location,
    timestamp: new Date().toISOString(),
    data
  });
});

// Test endpoint to simulate MQTT data in your exact format
app.post('/api/test/mqtt-simulate', (req, res) => {
  const { topic, data } = req.body;

  if (!topic || !data) {
    return res.status(400).json({
      error: 'Missing required fields: topic and data'
    });
  }

  try {
    // Parse the data as if it came from MQTT
    const parsedData = mqttService.parseWasteBinData(topic, data);

    if (parsedData) {
      // Store the data
      mqttService.storeWasteBinData(parsedData);

      // Notify WebSocket subscribers
      mqttService.notifySubscribers(parsedData);

      res.json({
        message: 'MQTT data simulated successfully',
        topic,
        parsedData
      });
    } else {
      res.status(400).json({
        error: 'Failed to parse data'
      });
    }
  } catch (error) {
    console.error('Error simulating MQTT data:', error);
    res.status(500).json({
      error: 'Failed to simulate MQTT data',
      details: error.message
    });
  }
});

// API Routes
app.use('/api/trash-bins', trashBinRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/users', userRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    // Start MQTT service
    mqttService.connect();

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;