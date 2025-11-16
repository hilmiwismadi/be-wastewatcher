const { pool } = require('../config/database');

class SensorReadingModel {
  // Create sensor_readings table if not exists
  static async createTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS sensor_readings (
        id SERIAL PRIMARY KEY,
        location VARCHAR(100) NOT NULL,
        bin_type VARCHAR(50) NOT NULL,
        sensor_top_left DECIMAL(10, 2),
        sensor_top_right DECIMAL(10, 2),
        sensor_bottom_left DECIMAL(10, 2),
        sensor_bottom_right DECIMAL(10, 2),
        average_distance DECIMAL(10, 2),
        weight DECIMAL(10, 2),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createIndexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_location ON sensor_readings(location);',
      'CREATE INDEX IF NOT EXISTS idx_bin_type ON sensor_readings(bin_type);',
      'CREATE INDEX IF NOT EXISTS idx_timestamp ON sensor_readings(timestamp);'
    ];

    try {
      await pool.query(createTableQuery);
      console.log('✅ sensor_readings table created/verified');

      // Create indexes
      for (const indexQuery of createIndexQueries) {
        await pool.query(indexQuery);
      }
      console.log('✅ sensor_readings indexes created/verified');
    } catch (error) {
      console.error('❌ Error creating sensor_readings table:', error);
      throw error;
    }
  }

  // Save new sensor reading
  static async create(readingData) {
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
    } = readingData;

    const query = `
      INSERT INTO sensor_readings (
        location,
        bin_type,
        sensor_top_left,
        sensor_top_right,
        sensor_bottom_left,
        sensor_bottom_right,
        average_distance,
        weight,
        timestamp
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      location,
      binType,
      sensorTopLeft,
      sensorTopRight,
      sensorBottomLeft,
      sensorBottomRight,
      averageDistance,
      weight,
      timestamp || new Date()
    ];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error saving sensor reading:', error);
      throw error;
    }
  }

  // Get latest readings by location
  static async getLatestByLocation(location, limit = 50) {
    const query = `
      SELECT * FROM sensor_readings
      WHERE location = $1
      ORDER BY timestamp DESC
      LIMIT $2
    `;

    try {
      const result = await pool.query(query, [location, limit]);
      return result.rows;
    } catch (error) {
      console.error('❌ Error fetching sensor readings:', error);
      throw error;
    }
  }

  // Get latest readings by location and bin type
  static async getLatestByLocationAndBinType(location, binType, limit = 50) {
    const query = `
      SELECT * FROM sensor_readings
      WHERE location = $1 AND bin_type = $2
      ORDER BY timestamp DESC
      LIMIT $3
    `;

    try {
      const result = await pool.query(query, [location, binType, limit]);
      return result.rows;
    } catch (error) {
      console.error('❌ Error fetching sensor readings by bin type:', error);
      throw error;
    }
  }

  // Get readings within time range
  static async getByTimeRange(location, binType, startTime, endTime) {
    const query = `
      SELECT * FROM sensor_readings
      WHERE location = $1
        AND bin_type = $2
        AND timestamp BETWEEN $3 AND $4
      ORDER BY timestamp ASC
    `;

    try {
      const result = await pool.query(query, [location, binType, startTime, endTime]);
      return result.rows;
    } catch (error) {
      console.error('❌ Error fetching sensor readings by time range:', error);
      throw error;
    }
  }

  // Get all locations
  static async getAllLocations() {
    const query = `
      SELECT DISTINCT location
      FROM sensor_readings
      ORDER BY location
    `;

    try {
      const result = await pool.query(query);
      return result.rows.map(row => row.location);
    } catch (error) {
      console.error('❌ Error fetching locations:', error);
      throw error;
    }
  }

  // Delete old readings (cleanup)
  static async deleteOldReadings(daysToKeep = 30) {
    const query = `
      DELETE FROM sensor_readings
      WHERE timestamp < NOW() - INTERVAL '${daysToKeep} days'
      RETURNING *
    `;

    try {
      const result = await pool.query(query);
      console.log(`🗑️ Deleted ${result.rowCount} old sensor readings`);
      return result.rowCount;
    } catch (error) {
      console.error('❌ Error deleting old readings:', error);
      throw error;
    }
  }
}

module.exports = SensorReadingModel;
