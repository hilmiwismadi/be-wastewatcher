const mqtt = require('mqtt');
const SensorReadingModel = require('../models/sensorReadingModel');
const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

class MQTTService {
  constructor() {
    this.client = null;
    this.subscribers = new Set();
    this.brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
    this.topics = ['CapsE6/Lt2SGLC/#', 'CapsE6/KantinSGLC/#']; // Multiple topics with wildcards to catch all subtopics
    this.latestData = {
      'Lt2SGLC': {
        organic: [],
        anorganic: [],
        residue: []
      },
      'KantinSGLC': {
        organic: [],
        anorganic: [],
        residue: []
      }
    };

    // Battery system configuration
    this.BATTERY_REDUCTION_RATE = 0.014; // 0.014% per MQTT message
    this.BATTERY_FLOOR = 0.0; // Minimum battery percentage

    // Map MQTT location + binType to Device IDs
    // This mapping connects MQTT topics to database device records
    this.locationToDeviceMapping = {
      'Lt2SGLC': {
        'organic': 'DEV-LT2-ORG',                // Device ID for LT2 Organic bin (if exists)
        'anorganic': 'DEV-LT2-ANO',              // Device ID for LT2 Anorganic bin (if exists)
        'residue': 'DEV-LT2-RES'                 // Device ID for LT2 Residue bin (if exists)
      },
      'KantinSGLC': {
        'organic': 'DEV_KANTIN_LT1_ORGANIC',     // Device ID for Kantin LT1 Organic bin
        'anorganic': 'DEV_KANTIN_LT1_ANORGANIC', // Device ID for Kantin LT1 Anorganic bin
        'residue': 'DEV_KANTIN_LT1_RESIDUE'      // Device ID for Kantin LT1 Residue bin
      }
    };

    // Initialize database table
    SensorReadingModel.createTable().catch(err => {
      console.error('Failed to create sensor_readings table on MQTT service init:', err);
    });
  }

  connect() {
    try {
      const options = {
        clientId: `wastewatcher-backend-${Math.random().toString(16).substr(2, 8)}`,
        clean: true,
        connectTimeout: 10000, // Increased from 4000ms to 10000ms
        reconnectPeriod: 5000, // Try to reconnect every 5 seconds
        keepalive: 60, // Send keepalive packets every 60 seconds
        protocolVersion: 4, // Use MQTT 3.1.1
        rejectUnauthorized: false, // For self-signed certificates
      };

      // Add authentication if provided
      if (process.env.MQTT_USERNAME) {
        options.username = process.env.MQTT_USERNAME;
      }
      if (process.env.MQTT_PASSWORD) {
        options.password = process.env.MQTT_PASSWORD;
      }

      console.log(`🔌 Connecting to MQTT broker: ${this.brokerUrl}`);
      this.client = mqtt.connect(this.brokerUrl, options);

      this.client.on('connect', () => {
        console.log('✅ Connected to MQTT broker');

        // Subscribe to multiple topics
        this.topics.forEach(topic => {
          this.client.subscribe(topic, (err) => {
            if (!err) {
              console.log(`📡 Subscribed to topic: ${topic}`);
            } else {
              console.error(`❌ MQTT subscription error for ${topic}:`, err);
            }
          });
        });
      });

      this.client.on('message', (topic, message) => {
        try {
          const rawData = JSON.parse(message.toString());
          console.log(`📊 Received MQTT data from ${topic}:`, rawData);

          // Parse your specific data format
          const parsedData = this.parseWasteBinData(topic, rawData);
          console.log('✅ Parsed data:', JSON.stringify(parsedData, null, 2));

          if (parsedData) {
            // Store data for HTTP polling
            this.storeWasteBinData(parsedData);
            console.log(`💾 Data stored for location: ${parsedData.location}`);

            // Save to database
            this.saveSensorReadingToDatabase(parsedData);

            // Update battery percentage for this device
            this.updateBatteryPercentage(parsedData.location, parsedData.binType);

            // Also notify WebSocket subscribers (if any)
            this.notifySubscribers(parsedData);
            console.log(`📤 Notified ${this.subscribers.size} WebSocket subscribers`);
          } else {
            console.error('❌ Parsing returned null - data not stored!');
          }
        } catch (error) {
          console.error('❌ Error parsing MQTT message:', error);
        }
      });

      this.client.on('error', (error) => {
        // Handle specific error types
        if (error.code === 'ECONNRESET') {
          console.warn('⚠️ MQTT connection reset - will auto-reconnect');
        } else if (error.message && error.message.includes('connack timeout')) {
          console.warn('⚠️ MQTT connection acknowledgment timeout - will retry');
        } else {
          console.error('❌ MQTT connection error:', error.message || error);
        }
      });

      this.client.on('close', () => {
        console.log('🔌 MQTT connection closed - attempting reconnection...');
      });

      this.client.on('reconnect', () => {
        console.log('🔄 Attempting to reconnect to MQTT broker...');
      });

      this.client.on('offline', () => {
        console.log('📴 MQTT client is offline');
      });

    } catch (error) {
      console.error('❌ Failed to connect to MQTT broker:', error);
    }
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      console.log('🔌 Disconnected from MQTT broker');
    }
  }

  // Add a subscriber (WebSocket connection)
  addSubscriber(callback) {
    this.subscribers.add(callback);
  }

  // Remove a subscriber
  removeSubscriber(callback) {
    this.subscribers.delete(callback);
  }

  // Notify all subscribers of new data
  notifySubscribers(data) {
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('❌ Error notifying subscriber:', error);
      }
    });
  }


  // =====================================================
  // 🔧 KONFIGURASI FORMAT DATA - MUDAH DIUBAH
  // =====================================================

  // Format data yang digunakan saat ini
  // Ubah nilai ini sesuai kebutuhan: 'array' atau 'object'
  dataFormat = 'array'; // 'array' untuk format baru, 'object' untuk format lama

  // =====================================================
  // 🔧 STRUKTUR DATA SEKARANG (Fase Development)
  // =====================================================
  // Topic: CapsE6/KantinSGLC -> Data untuk BIN ORGANIC (4 sensor)
  // Format: {"DISTANCE":[60,59,75,73]}
  // Index: [0]=topLeft, [1]=topRight, [2]=bottomLeft, [3]=bottomRight
  //
  // NANTI (Fase Production):
  // Topic: CapsE6/KantinSGLC/Organic -> {"DISTANCE":[60,59,75,73]}
  // Topic: CapsE6/KantinSGLC/Anorganic -> {"DISTANCE":[62,58,84,75]}
  // Topic: CapsE6/KantinSGLC/Residue -> {"DISTANCE":[70,59,164,74]}
  // =====================================================

  // =====================================================
  // Parse waste bin data - MENDUKUNG MULTIPLE FORMAT
  // =====================================================
  //
  // FORMAT YANG DIDUKUNG:
  //
  // 1. Format ARRAY (baru): {"DISTANCE":[61,61,34,33]}
  //    - Index 0: organic
  //    - Index 1: anorganic
  //    - Index 2: residue
  //    - Index 3: (cadangan untuk sensor tambahan)
  //
  // 2. Format OBJECT (lama): {"org":{"v":131,"w":892},"an":{"v":101,"w":874},"re":{"v":144,"w":693}}
  //
  // UNTUK MENAMBAHKAN SENSOR BARU (misal WEIGHT):
  // Uncomment baris yang ditandai dengan [WEIGHT] di bawah
  // =====================================================

  parseWasteBinData(topic, rawData) {
    try {
      // Extract location from topic (CapsE6/Lt2SGLC -> Lt2SGLC)
      const location = topic.split('/')[1];
      const timestamp = new Date().toISOString();

      console.log(`🔍 Parsing data - Format: ${this.dataFormat}, Location: ${location}`);

      // =====================================================
      // PILIH FORMAT BERDASARKAN KONFIGURASI
      // =====================================================

      if (this.dataFormat === 'array') {
        // =====================================================
        // FORMAT ARRAY (BARU): {"DISTANCE":[60,59,75,73]}
        // =====================================================
        // STRUKTUR: 4 sensor ultrasonic di 1 bin (4 sudut persegi)
        // Index: [0]=topLeft, [1]=topRight, [2]=bottomLeft, [3]=bottomRight

        const distance = rawData.DISTANCE || [];
        const weight = rawData.WEIGHT || 0; // [WEIGHT] Weight data from sensor

        // Deteksi bin type dari topic (untuk fase production nanti)
        const binType = this.detectBinType(topic);

        const result = {
          location: location,
          timestamp: timestamp,
          binType: binType, // 'organic', 'anorganic', atau 'residue'
          data: {
            // 4 SENSOR ULTRASONIC (dalam cm, dikonversi ke %)
            sensors: {
              topLeft: distance[0] || 0,
              topRight: distance[1] || 0,
              bottomLeft: distance[2] || 0,
              bottomRight: distance[3] || 0
            },
            // Hitung rata-rata untuk compatibility dengan sistem lama
            average: this.calculateAverage(distance),
            // WEIGHT from sensor (in grams)
            weight: weight
          }
        };

        return result;

      } else {
        // =====================================================
        // FORMAT OBJECT (LAMA): {"org":{"v":131,"w":892},...}
        // =====================================================

        const result = {
          location: location,
          timestamp: timestamp,
          data: {
            organic: {
              volume: rawData.org?.v || 0,
              weight: rawData.org?.w || 0
            },
            anorganic: {
              volume: rawData.an?.v || 0,
              weight: rawData.an?.w || 0
            },
            residue: {
              volume: rawData.re?.v || 0,
              weight: rawData.re?.w || 0
            }
          }
        };

        return result;
      }

    } catch (error) {
      console.error('❌ Error parsing waste bin data:', error);
      console.error('Raw data received:', rawData);
      return null;
    }
  }

  // =====================================================
  // HELPER: Deteksi tipe bin dari topic
  // =====================================================
  detectBinType(topic) {
    const topicLower = topic.toLowerCase();

    // Fase Production: CapsE6/KantinSGLC/Organic or CapsE6/KantinSGLC/Organik
    if (topicLower.includes('/organic') || topicLower.includes('/organik')) return 'organic';
    if (topicLower.includes('/anorganic') || topicLower.includes('/anorganik')) return 'anorganic';
    if (topicLower.includes('/residue') || topicLower.includes('/residu')) return 'residue';

    // Fase Development: CapsE6/KantinSGLC -> default ke organic
    return 'organic';
  }

  // =====================================================
  // HELPER: Hitung rata-rata sensor dengan error handling
  // =====================================================
  // Sensor readings >= 2000 are considered errors (e.g., 65535)
  // Only valid sensors are used in average calculation
  calculateAverage(distances) {
    if (!distances || distances.length === 0) return 0;

    // Error threshold - readings >= 2000cm are sensor errors
    const SENSOR_ERROR_THRESHOLD = 2000;
    const SENSOR_MIN_VALID = 0;

    // Filter out error readings
    const validDistances = distances.filter(val => {
      const num = val || 0;
      return num >= SENSOR_MIN_VALID && num < SENSOR_ERROR_THRESHOLD;
    });

    // If all sensors are errors, return 0
    if (validDistances.length === 0) return 0;

    // Calculate average using only valid sensors
    const sum = validDistances.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / validDistances.length);
  }

  // Store waste bin data
  storeWasteBinData(parsedData) {
    const location = parsedData.location;
    const binType = parsedData.binType; // 'organic', 'anorganic', 'residue'

    if (!this.latestData[location]) {
      this.latestData[location] = {
        organic: [],
        anorganic: [],
        residue: []
      };
    }

    // Store data ke bin type yang sesuai
    const binData = {
      timestamp: parsedData.timestamp,
      sensors: parsedData.data.sensors, // {topLeft, topRight, bottomLeft, bottomRight}
      average: parsedData.data.average,
      weight: parsedData.data.weight || 0 // Weight in grams
    };

    this.latestData[location][binType].push(binData);

    // Keep only last 50 data points
    if (this.latestData[location][binType].length > 50) {
      this.latestData[location][binType] = this.latestData[location][binType].slice(-50);
    }
  }

  // Save sensor reading to database
  async saveSensorReadingToDatabase(parsedData) {
    try {
      const reading = {
        location: parsedData.location,
        binType: parsedData.binType,
        sensorTopLeft: parsedData.data.sensors.topLeft,
        sensorTopRight: parsedData.data.sensors.topRight,
        sensorBottomLeft: parsedData.data.sensors.bottomLeft,
        sensorBottomRight: parsedData.data.sensors.bottomRight,
        averageDistance: parsedData.data.average,
        weight: parsedData.data.weight || 0,
        timestamp: new Date(parsedData.timestamp)
      };

      await SensorReadingModel.create(reading);
      console.log(`✅ Sensor reading saved to database: ${parsedData.location}/${parsedData.binType}`);
    } catch (error) {
      console.error('❌ Error saving sensor reading to database:', error);
      // Don't throw - we don't want MQTT processing to fail if DB save fails
    }
  }

  // Legacy method for simple sensor data (for backwards compatibility)
  storeData(data) {
    // This is kept for testing/simulation purposes
    console.log('📝 Legacy storeData called:', data);
  }

  // Get latest data for HTTP API
  getLatestData(sensor = null) {
    if (sensor) {
      return this.latestData[sensor] || [];
    }
    return this.latestData;
  }

  // Publish data to MQTT (for testing)
  publish(data) {
    if (this.client && this.client.connected) {
      this.client.publish(this.topic, JSON.stringify(data));
      console.log('📤 Published to MQTT:', data);
    } else {
      console.error('❌ MQTT client not connected');
    }
  }

  // =====================================================
  // 🔋 BATTERY MANAGEMENT SYSTEM
  // =====================================================

  /**
   * Get device ID from MQTT location and bin type
   * @param {string} location - MQTT location (e.g., 'Lt2SGLC', 'KantinSGLC')
   * @param {string} binType - Bin type ('organic', 'anorganic', 'residue')
   * @returns {string|null} Device ID or null if not found
   */
  getDeviceIdFromLocation(location, binType) {
    try {
      const deviceId = this.locationToDeviceMapping[location]?.[binType];

      if (!deviceId) {
        console.warn(`⚠️ No device mapping found for location: ${location}, binType: ${binType}`);
        return null;
      }

      return deviceId;
    } catch (error) {
      console.error('❌ Error getting device ID from location:', error);
      return null;
    }
  }

  /**
   * Update battery percentage for a device (reduce by 0.014%)
   * Called automatically when MQTT data is received
   * @param {string} location - MQTT location
   * @param {string} binType - Bin type
   */
  async updateBatteryPercentage(location, binType) {
    try {
      // Get device ID from location mapping
      const deviceId = this.getDeviceIdFromLocation(location, binType);

      if (!deviceId) {
        console.warn(`⚠️ Skipping battery update - no device ID for ${location}/${binType}`);
        return;
      }

      // Get current battery from latest devicehealth record
      const latestHealth = await prisma.deviceHealth.findFirst({
        where: { deviceid: deviceId },
        orderBy: { timestamp: 'desc' }
      });

      let currentBattery = latestHealth?.battery_percentage ?? 94.0;

      // Calculate new battery (reduce by 0.014%)
      let newBattery = currentBattery - this.BATTERY_REDUCTION_RATE;

      // Apply floor (cannot go below 0%)
      newBattery = Math.max(newBattery, this.BATTERY_FLOOR);

      // Generate unique health ID
      const healthId = `DH-${deviceId}-${Date.now()}`;

      // Insert new battery record
      await prisma.deviceHealth.create({
        data: {
          healthid: healthId,
          deviceid: deviceId,
          battery_percentage: newBattery,
          error_count_24h: latestHealth?.error_count_24h ?? 0,
          timestamp: new Date()
        }
      });

      console.log(`🔋 Battery updated for ${deviceId}: ${currentBattery.toFixed(3)}% → ${newBattery.toFixed(3)}% (-${this.BATTERY_REDUCTION_RATE}%)`);

      // Warn if battery is critically low
      if (newBattery <= 20 && newBattery > this.BATTERY_FLOOR) {
        console.warn(`⚠️ LOW BATTERY WARNING: Device ${deviceId} is at ${newBattery.toFixed(2)}%`);
      } else if (newBattery === this.BATTERY_FLOOR) {
        console.error(`🚨 CRITICAL: Device ${deviceId} battery depleted (0%)!`);
      }

    } catch (error) {
      console.error(`❌ Error updating battery for ${location}/${binType}:`, error);
      // Don't throw - battery update failure shouldn't break MQTT processing
    }
  }

  /**
   * Get current battery percentage for a device
   * @param {string} deviceId - Device ID
   * @returns {Promise<number|null>} Current battery percentage or null
   */
  async getCurrentBattery(deviceId) {
    try {
      const latestHealth = await prisma.deviceHealth.findFirst({
        where: { deviceid: deviceId },
        orderBy: { timestamp: 'desc' },
        select: { battery_percentage: true }
      });

      return latestHealth?.battery_percentage ?? null;
    } catch (error) {
      console.error(`❌ Error getting current battery for ${deviceId}:`, error);
      return null;
    }
  }
}

// Singleton instance
const mqttService = new MQTTService();

module.exports = mqttService;