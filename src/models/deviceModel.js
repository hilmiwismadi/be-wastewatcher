const { pool } = require('../config/database');

class DeviceModel {
  // Get all devices with their status and sensor count
  static async getAll() {
    const query = `
      SELECT
        d.*,
        tb.name as bin_name,
        tb.location,
        COUNT(s.sensorId) as sensor_count,
        bs.total_weight_kg,
        bs.average_volume_percentage,
        bs.status as fill_status,
        bs.last_updated,
        dh.battery_percentage,
        dh.error_count_24h
      FROM Device d
      LEFT JOIN TrashBin tb ON d.trashbinId = tb.trashbinId
      LEFT JOIN Sensor s ON d.deviceId = s.deviceId
      LEFT JOIN BinStatus bs ON d.deviceId = bs.deviceId
      LEFT JOIN DeviceHealth dh ON d.deviceId = dh.deviceId AND dh.timestamp = (
        SELECT MAX(timestamp) FROM DeviceHealth WHERE deviceId = d.deviceId
      )
      GROUP BY d.deviceId, tb.name, tb.location, bs.total_weight_kg, bs.average_volume_percentage,
               bs.status, bs.last_updated, dh.battery_percentage, dh.error_count_24h
      ORDER BY d.created_at DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  // Get device by ID with detailed information
  static async getById(deviceId) {
    const query = `
      SELECT
        d.*,
        tb.name as bin_name,
        tb.location,
        tb.area,
        tb.floor,
        json_agg(
          json_build_object(
            'sensorId', s.sensorId,
            'sensor_type', s.sensor_type,
            'sensor_position', s.sensor_position,
            'status', s.status,
            'last_calibrated_date', s.last_calibrated_date
          )
        ) FILTER (WHERE s.sensorId IS NOT NULL) as sensors
      FROM Device d
      LEFT JOIN TrashBin tb ON d.trashbinId = tb.trashbinId
      LEFT JOIN Sensor s ON d.deviceId = s.deviceId
      WHERE d.deviceId = $1
      GROUP BY d.deviceId, tb.name, tb.location, tb.area, tb.floor
    `;

    const result = await pool.query(query, [deviceId]);
    return result.rows[0] || null;
  }

  // Get devices by category
  static async getByCategory(category) {
    const query = `
      SELECT
        d.*,
        tb.name as bin_name,
        tb.location,
        bs.status as fill_status,
        bs.average_volume_percentage,
        bs.total_weight_kg
      FROM Device d
      LEFT JOIN TrashBin tb ON d.trashbinId = tb.trashbinId
      LEFT JOIN BinStatus bs ON d.deviceId = bs.deviceId
      WHERE d.category = $1
      ORDER BY d.created_at DESC
    `;

    const result = await pool.query(query, [category]);
    return result.rows;
  }

  // Get devices with health status
  static async getWithHealthStatus() {
    const query = `
      SELECT
        d.deviceId,
        d.category,
        d.status,
        tb.name as bin_name,
        tb.location,
        dh.battery_percentage,
        dh.error_count_24h,
        dh.error_details,
        dh.timestamp as last_health_check,
        CASE
          WHEN dh.battery_percentage < 20 THEN 'critical'
          WHEN dh.battery_percentage < 40 THEN 'low'
          WHEN dh.error_count_24h > 5 THEN 'warning'
          ELSE 'healthy'
        END as health_status
      FROM Device d
      LEFT JOIN TrashBin tb ON d.trashbinId = tb.trashbinId
      LEFT JOIN DeviceHealth dh ON d.deviceId = dh.deviceId AND dh.timestamp = (
        SELECT MAX(timestamp) FROM DeviceHealth WHERE deviceId = d.deviceId
      )
      ORDER BY health_status DESC, d.deviceId
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  // Get device current status with real-time data
  static async getCurrentStatus(deviceId) {
    const query = `
      SELECT
        d.*,
        tb.name as bin_name,
        tb.location,
        bs.total_weight_kg,
        bs.average_volume_percentage,
        bs.status as fill_status,
        bs.condition,
        bs.last_updated,
        bs.sensor_contributions,
        dh.battery_percentage,
        dh.error_count_24h,
        dh.error_details
      FROM Device d
      LEFT JOIN TrashBin tb ON d.trashbinId = tb.trashbinId
      LEFT JOIN BinStatus bs ON d.deviceId = bs.deviceId
      LEFT JOIN DeviceHealth dh ON d.deviceId = dh.deviceId AND dh.timestamp = (
        SELECT MAX(timestamp) FROM DeviceHealth WHERE deviceId = d.deviceId
      )
      WHERE d.deviceId = $1
    `;

    const result = await pool.query(query, [deviceId]);
    return result.rows[0] || null;
  }

  // Create new device
  static async create(deviceData) {
    const {
      deviceId,
      trashbinId,
      category,
      installation_date,
      status = 'active'
    } = deviceData;

    const query = `
      INSERT INTO Device (deviceId, trashbinId, category, installation_date, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [deviceId, trashbinId, category, installation_date, status];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Update device
  static async update(deviceId, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updateData[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(deviceId);
    const query = `
      UPDATE Device
      SET ${fields.join(', ')}
      WHERE deviceId = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  // Delete device
  static async delete(deviceId) {
    const query = 'DELETE FROM Device WHERE deviceId = $1 RETURNING *';
    const result = await pool.query(query, [deviceId]);
    return result.rows[0] || null;
  }

  // Get device statistics
  static async getStatistics() {
    const query = `
      SELECT
        COUNT(*) as total_devices,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_devices,
        COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_devices,
        COUNT(CASE WHEN status = 'faulty' THEN 1 END) as faulty_devices,
        COUNT(CASE WHEN status = 'offline' THEN 1 END) as offline_devices,
        COUNT(CASE WHEN category = 'Organic' THEN 1 END) as organic_devices,
        COUNT(CASE WHEN category = 'Inorganic' THEN 1 END) as inorganic_devices,
        COUNT(CASE WHEN category = 'B3' THEN 1 END) as b3_devices
      FROM Device
    `;

    const result = await pool.query(query);
    return result.rows[0];
  }
}

module.exports = DeviceModel;