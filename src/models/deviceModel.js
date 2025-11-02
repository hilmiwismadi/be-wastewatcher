const { pool } = require('../config/database');

class DeviceModel {
  // Get all devices with their status and sensor count
  static async getAll() {
    const query = `
      SELECT
        d.*,
        tb.name as bin_name,
        tb.location,
        COUNT(s.sensorid) as sensor_count,
        bs.total_weight_kg,
        bs.average_volume_percentage,
        bs.status as fill_status,
        bs.last_updated,
        dh.battery_percentage,
        dh.error_count_24h
      FROM device d
      LEFT JOIN trashbin tb ON d.trashbinid = tb.trashbinid
      LEFT JOIN sensor s ON d.deviceid = s.deviceid
      LEFT JOIN binstatus bs ON d.deviceid = bs.deviceid
      LEFT JOIN deviceHealth dh ON d.deviceid = dh.deviceid AND dh.timestamp = (
        SELECT MAX(timestamp) FROM deviceHealth WHERE deviceid = d.deviceid
      )
      GROUP BY d.deviceid, tb.name, tb.location, bs.total_weight_kg, bs.average_volume_percentage,
               bs.status, bs.last_updated, dh.battery_percentage, dh.error_count_24h
      ORDER BY d.created_at DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  // Get device by ID with detailed information
  static async getById(deviceid) {
    const query = `
      SELECT
        d.*,
        tb.name as bin_name,
        tb.location,
        tb.area,
        tb.floor,
        json_agg(
          json_build_object(
            'sensorId', s.sensorid,
            'sensor_type', s.sensor_type,
            'sensor_position', s.sensor_position,
            'status', s.status,
            'last_calibrated_date', s.last_calibrated_date
          )
        ) FILTER (WHERE s.sensorid IS NOT NULL) as sensors
      FROM device d
      LEFT JOIN trashbin tb ON d.trashbinid = tb.trashbinid
      LEFT JOIN sensor s ON d.deviceid = s.deviceid
      WHERE d.deviceid = $1
      GROUP BY d.deviceid, tb.name, tb.location, tb.area, tb.floor
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
      FROM device d
      LEFT JOIN trashbin tb ON d.trashbinid = tb.trashbinid
      LEFT JOIN binstatus bs ON d.deviceid = bs.deviceid
      WHERE d.category = $1
      ORDER BY d.created_at DESC
    `;

    const result = await pool.query(query, [category]);
    return result.rows;
  }

  // Get devices by trash bin ID
  static async getByTrashBinId(trashbinid) {
    const query = `
      SELECT
        d.*,
        tb.name as bin_name,
        tb.location,
        COUNT(s.sensorid) as sensor_count,
        bs.total_weight_kg,
        bs.average_volume_percentage,
        bs.status as fill_status,
        bs.last_updated,
        dh.battery_percentage,
        dh.error_count_24h
      FROM device d
      LEFT JOIN trashbin tb ON d.trashbinid = tb.trashbinid
      LEFT JOIN sensor s ON d.deviceid = s.deviceid
      LEFT JOIN binstatus bs ON d.deviceid = bs.deviceid
      LEFT JOIN deviceHealth dh ON d.deviceid = dh.deviceid AND dh.timestamp = (
        SELECT MAX(timestamp) FROM deviceHealth WHERE deviceid = d.deviceid
      )
      WHERE d.trashbinid = $1
      GROUP BY d.deviceid, tb.name, tb.location, bs.total_weight_kg, bs.average_volume_percentage,
               bs.status, bs.last_updated, dh.battery_percentage, dh.error_count_24h
      ORDER BY d.category
    `;

    const result = await pool.query(query, [trashbinid]);
    return result.rows;
  }

  // Get devices with health status
  static async getWithHealthStatus() {
    const query = `
      SELECT
        d.deviceid,
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
      FROM device d
      LEFT JOIN trashbin tb ON d.trashbinid = tb.trashbinid
      LEFT JOIN deviceHealth dh ON d.deviceid = dh.deviceid AND dh.timestamp = (
        SELECT MAX(timestamp) FROM deviceHealth WHERE deviceid = d.deviceid
      )
      ORDER BY health_status DESC, d.deviceid
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  // Get device current status with real-time data
  static async getCurrentStatus(deviceid) {
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
      FROM device d
      LEFT JOIN trashbin tb ON d.trashbinid = tb.trashbinid
      LEFT JOIN binstatus bs ON d.deviceid = bs.deviceid
      LEFT JOIN deviceHealth dh ON d.deviceid = dh.deviceid AND dh.timestamp = (
        SELECT MAX(timestamp) FROM deviceHealth WHERE deviceid = d.deviceid
      )
      WHERE d.deviceid = $1
    `;

    const result = await pool.query(query, [deviceId]);
    return result.rows[0] || null;
  }

  // Create new device
  static async create(deviceData) {
    const {
      deviceid,
      trashbinid,
      category,
      installation_date,
      status = 'active'
    } = deviceData;

    const query = `
      INSERT INTO Device (deviceid, trashbinid, category, installation_date, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [deviceId, trashbinid, category, installation_date, status];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Update device
  static async update(deviceid, updateData) {
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

    values.push(deviceid);
    const query = `
      UPDATE Device
      SET ${fields.join(', ')}
      WHERE deviceid = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  // Delete device
  static async delete(deviceid) {
    const query = 'DELETE FROM device WHERE deviceid = $1 RETURNING *';
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
      FROM device
    `;

    const result = await pool.query(query);
    return result.rows[0];
  }
}

module.exports = DeviceModel;