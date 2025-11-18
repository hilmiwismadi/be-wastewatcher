const express = require('express');
const router = express.Router();
const SensorReadingModel = require('../models/sensorReadingModel');

// Initialize sensor readings table
SensorReadingModel.createTable().catch(err => {
  console.error('Failed to create sensor_readings table:', err);
});

/**
 * @swagger
 * /api/sensors/readings:
 *   post:
 *     tags:
 *       - Sensors
 *     summary: Save sensor reading
 *     description: Store a new sensor reading from IoT device
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - location
 *               - binType
 *             properties:
 *               location:
 *                 type: string
 *                 example: KantinSGLC
 *               binType:
 *                 type: string
 *                 enum: [organic, anorganic, residue]
 *                 example: organic
 *               sensorTopLeft:
 *                 type: number
 *                 example: 25.5
 *               sensorTopRight:
 *                 type: number
 *                 example: 26.3
 *               sensorBottomLeft:
 *                 type: number
 *                 example: 24.8
 *               sensorBottomRight:
 *                 type: number
 *                 example: 25.1
 *               averageDistance:
 *                 type: number
 *                 example: 25.425
 *               weight:
 *                 type: number
 *                 example: 12.5
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-11-18T10:30:00.000Z
 *     responses:
 *       201:
 *         description: Sensor reading saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Sensor reading saved successfully
 *                 data:
 *                   $ref: '#/components/schemas/SensorReading'
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
router.post('/readings', async (req, res) => {
  try {
    const {
      location,
      binType,
      sensorTopLeft,
      sensorTopRight,
      sensorBottomLeft,
      sensorBottomRight,
      averageDistance,
      weight,
      timestamp
    } = req.body;

    // Validation
    if (!location || !binType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: location and binType'
      });
    }

    // Save to database
    const reading = await SensorReadingModel.create({
      location,
      binType,
      sensorTopLeft: sensorTopLeft || 0,
      sensorTopRight: sensorTopRight || 0,
      sensorBottomLeft: sensorBottomLeft || 0,
      sensorBottomRight: sensorBottomRight || 0,
      averageDistance: averageDistance || 0,
      weight: weight || 0,
      timestamp: timestamp || new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Sensor reading saved successfully',
      data: reading
    });
  } catch (error) {
    console.error('Error saving sensor reading:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save sensor reading',
      details: error.message
    });
  }
});

// GET endpoint to retrieve sensor readings by location
router.get('/readings/:location', async (req, res) => {
  try {
    const { location } = req.params;
    const { binType, limit = 50 } = req.query;

    let readings;

    // Special case: fetch all readings regardless of location
    if (location === 'all') {
      const query = `
        SELECT * FROM sensor_readings
        ORDER BY timestamp DESC
        LIMIT $1
      `;
      const result = await require('../config/database').pool.query(query, [parseInt(limit)]);
      readings = result.rows;
    } else if (binType) {
      readings = await SensorReadingModel.getLatestByLocationAndBinType(
        location,
        binType,
        parseInt(limit)
      );
    } else {
      readings = await SensorReadingModel.getLatestByLocation(
        location,
        parseInt(limit)
      );
    }

    res.json({
      success: true,
      location,
      binType: binType || 'all',
      count: readings.length,
      data: readings
    });
  } catch (error) {
    console.error('Error fetching sensor readings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sensor readings',
      details: error.message
    });
  }
});

// GET endpoint to retrieve sensor readings by time range
router.get('/readings/:location/range', async (req, res) => {
  try {
    const { location } = req.params;
    const { binType, startTime, endTime } = req.query;

    if (!binType || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query parameters: binType, startTime, endTime'
      });
    }

    const readings = await SensorReadingModel.getByTimeRange(
      location,
      binType,
      new Date(startTime),
      new Date(endTime)
    );

    res.json({
      success: true,
      location,
      binType,
      startTime,
      endTime,
      count: readings.length,
      data: readings
    });
  } catch (error) {
    console.error('Error fetching sensor readings by time range:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sensor readings',
      details: error.message
    });
  }
});

// GET endpoint to retrieve all locations
router.get('/locations', async (req, res) => {
  try {
    const locations = await SensorReadingModel.getAllLocations();
    res.json({
      success: true,
      count: locations.length,
      data: locations
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch locations',
      details: error.message
    });
  }
});

module.exports = router;