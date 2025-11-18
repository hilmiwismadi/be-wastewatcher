const swaggerJsdoc = require('swagger-jsdoc');
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

// Load additional API documentation from YAML file
let additionalAPIs = {};
try {
  const yamlFile = fs.readFileSync(path.join(__dirname, '../docs/swagger-all-routes.yaml'), 'utf8');
  additionalAPIs = yaml.load(yamlFile);
} catch (e) {
  console.log('No additional API documentation found');
}

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WasteWatcher API Documentation',
      version: '1.0.0',
      description: 'Comprehensive API documentation for WasteWatcher smart waste management system',
      contact: {
        name: 'WasteWatcher Team',
        email: 'support@wastewatcher.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://web-production-99408.up.railway.app',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        TrashBin: {
          type: 'object',
          properties: {
            trashbinid: {
              type: 'string',
              example: 'TB-SELATAN-LT1'
            },
            name: {
              type: 'string',
              example: 'Kantin LT 1'
            },
            location: {
              type: 'string',
              example: 'Kantin Selatan Lantai 1'
            },
            latitude: {
              type: 'number',
              example: -6.2088
            },
            longitude: {
              type: 'number',
              example: 106.8456
            },
            capacity: {
              type: 'number',
              example: 100
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'maintenance'],
              example: 'active'
            }
          }
        },
        Device: {
          type: 'object',
          properties: {
            deviceid: {
              type: 'string',
              example: 'DEV-SELATAN-LT1-ORG'
            },
            trashbinid: {
              type: 'string',
              example: 'TB-SELATAN-LT1'
            },
            category: {
              type: 'string',
              enum: ['Organic', 'Anorganic', 'Residue'],
              example: 'Organic'
            },
            sensor_top_left: {
              type: 'number',
              example: 25.5
            },
            sensor_top_right: {
              type: 'number',
              example: 26.3
            },
            sensor_bottom_left: {
              type: 'number',
              example: 24.8
            },
            sensor_bottom_right: {
              type: 'number',
              example: 25.1
            },
            average_distance: {
              type: 'number',
              example: 25.425
            },
            fill_percentage: {
              type: 'number',
              example: 45.2
            },
            average_volume_percentage: {
              type: 'number',
              example: 45.2
            },
            weight_kg: {
              type: 'number',
              example: 12.5
            },
            battery_percentage: {
              type: 'number',
              example: 85
            },
            fill_status: {
              type: 'string',
              enum: ['empty', 'low', 'medium', 'high', 'full'],
              example: 'medium'
            },
            last_updated: {
              type: 'string',
              format: 'date-time',
              example: '2025-11-18T10:30:00.000Z'
            }
          }
        },
        SensorReading: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            location: {
              type: 'string',
              example: 'kantinlt1'
            },
            bin_type: {
              type: 'string',
              enum: ['organic', 'anorganic', 'residue'],
              example: 'organic'
            },
            sensor_top_left: {
              type: 'number',
              example: 25.5
            },
            sensor_top_right: {
              type: 'number',
              example: 26.3
            },
            sensor_bottom_left: {
              type: 'number',
              example: 24.8
            },
            sensor_bottom_right: {
              type: 'number',
              example: 25.1
            },
            average_distance: {
              type: 'number',
              example: 25.425
            },
            weight: {
              type: 'number',
              example: 12.5
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2025-11-18T10:30:00.000Z'
            }
          }
        },
        DailyAnalytics: {
          type: 'object',
          properties: {
            analysis_date: {
              type: 'string',
              format: 'date',
              example: '2025-11-18'
            },
            deviceid: {
              type: 'string',
              example: 'DEV-SELATAN-LT1-ORG'
            },
            category: {
              type: 'string',
              example: 'Organic'
            },
            avg_weight: {
              type: 'number',
              example: 15.5
            },
            max_weight: {
              type: 'number',
              example: 25.0
            },
            avg_volume: {
              type: 'number',
              example: 45.2
            },
            max_volume: {
              type: 'number',
              example: 75.5
            },
            total_collections: {
              type: 'integer',
              example: 3
            }
          }
        },
        Alert: {
          type: 'object',
          properties: {
            alertid: {
              type: 'string',
              example: 'ALT-001'
            },
            trashbinid: {
              type: 'string',
              example: 'TB-SELATAN-LT1'
            },
            deviceid: {
              type: 'string',
              example: 'DEV-SELATAN-LT1-ORG'
            },
            alert_type: {
              type: 'string',
              enum: ['full', 'maintenance', 'malfunction'],
              example: 'full'
            },
            severity: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
              example: 'high'
            },
            message: {
              type: 'string',
              example: 'Trash bin is 95% full'
            },
            status: {
              type: 'string',
              enum: ['active', 'acknowledged', 'resolved'],
              example: 'active'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2025-11-18T10:30:00.000Z'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Error message'
            },
            message: {
              type: 'string',
              example: 'Detailed error description'
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object'
            },
            message: {
              type: 'string',
              example: 'Operation completed successfully'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Health',
        description: 'Health check and server status endpoints'
      },
      {
        name: 'Trash Bins',
        description: 'Trash bin management endpoints'
      },
      {
        name: 'Devices',
        description: 'IoT device management endpoints'
      },
      {
        name: 'Sensors',
        description: 'Sensor readings and data endpoints'
      },
      {
        name: 'Analytics',
        description: 'Analytics and reporting endpoints'
      },
      {
        name: 'Alerts',
        description: 'Alert and notification endpoints'
      },
      {
        name: 'Users',
        description: 'User management endpoints'
      },
      {
        name: 'Testing',
        description: 'Testing and simulation endpoints'
      }
    ]
  },
  apis: [
    './src/server.js',
    './src/routes/*.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

// Merge additional API paths from YAML
if (additionalAPIs.paths) {
  swaggerSpec.paths = { ...swaggerSpec.paths, ...additionalAPIs.paths };
}

module.exports = swaggerSpec;
