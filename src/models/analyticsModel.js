const { pool } = require('../config/database');

class AnalyticsModel {
  // Get dashboard overview statistics
  static async getDashboardOverview() {
    const query = `
      SELECT
        COUNT(DISTINCT tb.trashbinId) as total_bins,
        COUNT(DISTINCT d.deviceId) as total_devices,
        COUNT(DISTINCT d.deviceId) FILTER (WHERE d.status = 'active') as active_devices,
        COUNT(DISTINCT bs.binStatusId) FILTER (WHERE bs.status IN ('full', 'overflowing')) as bins_need_collection,
        ROUND(AVG(bs.average_volume_percentage)::numeric, 1) as avg_fill_percentage,
        ROUND(AVG(dh.battery_percentage)::numeric, 1) as avg_battery_level,
        COUNT(DISTINCT al.alertId) FILTER (WHERE al.resolved_at IS NULL) as active_alerts
      FROM TrashBin tb
      LEFT JOIN Device d ON tb.trashbinId = d.trashbinId
      LEFT JOIN BinStatus bs ON d.deviceId = bs.deviceId
      LEFT JOIN DeviceHealth dh ON d.deviceId = dh.deviceId AND dh.timestamp = (
        SELECT MAX(timestamp) FROM DeviceHealth WHERE deviceId = d.deviceId
      )
      LEFT JOIN AlertLog al ON d.deviceId = al.deviceId
      WHERE tb.status = 'active'
    `;

    const result = await pool.query(query);
    return result.rows[0];
  }

  // Get waste category distribution
  static async getWasteCategoryDistribution() {
    const query = `
      SELECT
        d.category,
        COUNT(*) as device_count,
        ROUND(AVG(bs.total_weight_kg)::numeric, 2) as avg_weight,
        ROUND(AVG(bs.average_volume_percentage)::numeric, 1) as avg_fill_percentage,
        wc.color_code
      FROM Device d
      LEFT JOIN BinStatus bs ON d.deviceId = bs.deviceId
      LEFT JOIN WasteCategory wc ON d.category = wc.category_name
      WHERE d.status = 'active'
      GROUP BY d.category, wc.color_code
      ORDER BY device_count DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  // Get hourly waste patterns for the last 24 hours
  static async getHourlyWastePatterns(deviceId = null, category = null) {
    let whereClause = "WHERE wd.timestamp >= NOW() - INTERVAL '24 hours'";
    const params = [];
    let paramCount = 1;

    if (deviceId) {
      whereClause += ` AND d.deviceId = $${paramCount}`;
      params.push(deviceId);
      paramCount++;
    }

    if (category) {
      whereClause += ` AND d.category = $${paramCount}`;
      params.push(category);
    }

    const query = `
      SELECT
        EXTRACT(HOUR FROM wd.timestamp) as hour,
        COUNT(*) as data_points,
        ROUND(AVG(wd.weight_kg)::numeric, 2) as avg_weight,
        ROUND(MAX(wd.weight_kg)::numeric, 2) as max_weight,
        ROUND(MIN(wd.weight_kg)::numeric, 2) as min_weight
      FROM WeightData wd
      JOIN Sensor s ON wd.sensorId = s.sensorId
      JOIN Device d ON s.deviceId = d.deviceId
      ${whereClause}
      GROUP BY EXTRACT(HOUR FROM wd.timestamp)
      ORDER BY hour
    `;

    const result = await pool.query(query, params);
    return result.rows;
  }

  // Get daily analytics for chart data
  static async getDailyAnalytics(days = 30, category = null, startDate = null, endDate = null) {
    let whereClause = "WHERE da.analysis_date >= CURRENT_DATE - INTERVAL '30 days'";
    const params = [];
    let paramCount = 1;

    // Use specific date range if provided
    if (startDate && endDate) {
      whereClause = `WHERE da.analysis_date >= $${paramCount} AND da.analysis_date <= $${paramCount + 1}`;
      params.push(startDate, endDate);
      paramCount += 2;
    } else if (days) {
      whereClause = `WHERE da.analysis_date >= CURRENT_DATE - INTERVAL '${days} days'`;
    }

    if (category) {
      whereClause += ` AND d.category = $${paramCount}`;
      params.push(category);
    }

    const query = `
      SELECT
        da.analysis_date,
        COUNT(*) as device_count,
        ROUND(AVG(da.avg_weight)::numeric, 2) as avg_weight,
        ROUND(AVG(da.max_weight)::numeric, 2) as max_weight,
        ROUND(AVG(da.avg_volume)::numeric, 2) as avg_volume,
        ROUND(AVG(da.max_volume)::numeric, 2) as max_volume,
        ROUND(SUM(da.collection_frequency)::numeric, 0) as total_collections,
        ROUND(AVG(da.waste_density)::numeric, 3) as avg_density
      FROM DailyAnalytics da
      JOIN Device d ON da.deviceId = d.deviceId
      ${whereClause}
      GROUP BY da.analysis_date
      ORDER BY da.analysis_date
    `;

    const result = await pool.query(query, params);
    return result.rows;
  }

  // Get fill level distribution across all bins
  static async getFillLevelDistribution() {
    const query = `
      SELECT
        bs.status as fill_level,
        COUNT(*) as bin_count,
        ROUND(AVG(bs.average_volume_percentage)::numeric, 1) as avg_percentage,
        ARRAY_AGG(DISTINCT d.category) as categories
      FROM BinStatus bs
      JOIN Device d ON bs.deviceId = d.deviceId
      WHERE d.status = 'active'
      GROUP BY bs.status
      ORDER BY
        CASE bs.status
          WHEN 'empty' THEN 1
          WHEN 'low' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'high' THEN 4
          WHEN 'full' THEN 5
          WHEN 'overflowing' THEN 6
        END
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  // Get location-based analytics
  static async getLocationAnalytics() {
    const query = `
      SELECT
        tb.area,
        COUNT(DISTINCT tb.trashbinId) as bin_count,
        COUNT(DISTINCT d.deviceId) as device_count,
        ROUND(AVG(bs.average_volume_percentage)::numeric, 1) as avg_fill_percentage,
        ROUND(AVG(bs.total_weight_kg)::numeric, 2) as avg_weight,
        COUNT(CASE WHEN bs.status IN ('full', 'overflowing') THEN 1 END) as bins_need_collection
      FROM TrashBin tb
      LEFT JOIN Device d ON tb.trashbinId = d.trashbinId
      LEFT JOIN BinStatus bs ON d.deviceId = bs.deviceId
      WHERE tb.status = 'active' AND tb.area IS NOT NULL
      GROUP BY tb.area
      ORDER BY avg_fill_percentage DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  // Get real-time sensor data for charts
  static async getRealTimeData(deviceId, hours = 24) {
    const query = `
      SELECT
        'weight' as data_type,
        wd.timestamp,
        wd.weight_kg as value,
        s.sensor_position
      FROM WeightData wd
      JOIN Sensor s ON wd.sensorId = s.sensorId
      WHERE s.deviceId = $1 AND wd.timestamp >= NOW() - INTERVAL '${hours} hours'

      UNION ALL

      SELECT
        'volume' as data_type,
        vd.timestamp,
        vd.fill_percentage as value,
        s.sensor_position
      FROM VolumeData vd
      JOIN Sensor s ON vd.sensorId = s.sensorId
      WHERE s.deviceId = $1 AND vd.timestamp >= NOW() - INTERVAL '${hours} hours'

      ORDER BY timestamp DESC
      LIMIT 1000
    `;

    const result = await pool.query(query, [deviceId]);
    return result.rows;
  }

  // Get collection frequency trends
  static async getCollectionTrends(days = 30) {
    const query = `
      SELECT
        da.analysis_date,
        SUM(da.collection_frequency) as total_collections,
        COUNT(DISTINCT da.deviceId) as active_devices,
        ROUND(AVG(da.collection_frequency)::numeric, 2) as avg_collections_per_device,
        STRING_AGG(DISTINCT d.category, ', ') as categories_collected
      FROM DailyAnalytics da
      JOIN Device d ON da.deviceId = d.deviceId
      WHERE da.analysis_date >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY da.analysis_date
      ORDER BY da.analysis_date
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  // Get device health trends
  static async getDeviceHealthTrends(days = 7) {
    const query = `
      SELECT
        DATE(dh.timestamp) as date,
        ROUND(AVG(dh.battery_percentage)::numeric, 1) as avg_battery,
        ROUND(MIN(dh.battery_percentage)::numeric, 1) as min_battery,
        COUNT(CASE WHEN dh.battery_percentage < 20 THEN 1 END) as critical_battery_count,
        ROUND(AVG(dh.error_count_24h)::numeric, 1) as avg_errors,
        COUNT(DISTINCT dh.deviceId) as devices_reporting
      FROM DeviceHealth dh
      JOIN Device d ON dh.deviceId = d.deviceId
      WHERE dh.timestamp >= CURRENT_DATE - INTERVAL '${days} days'
        AND d.status = 'active'
      GROUP BY DATE(dh.timestamp)
      ORDER BY date
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  // Get alert statistics
  static async getAlertStatistics(days = 30) {
    const query = `
      SELECT
        alert_type,
        COUNT(*) as total_alerts,
        COUNT(CASE WHEN resolved_at IS NULL THEN 1 END) as unresolved_alerts,
        COUNT(CASE WHEN resolved_at IS NOT NULL THEN 1 END) as resolved_alerts,
        ROUND(AVG(EXTRACT(EPOCH FROM (COALESCE(resolved_at, NOW()) - triggered_at)) / 3600)::numeric, 2) as avg_resolution_hours
      FROM AlertLog
      WHERE triggered_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY alert_type
      ORDER BY total_alerts DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  // Get TB001 Volume Data for all waste categories
  static async getTB001VolumeData() {
    const query = `
      SELECT
        tb.trashbinId,
        tb.name as trashbin_name,
        tb.location,
        d.deviceId,
        d.category as waste_category,
        s.sensorId,
        s.sensor_type,
        s.sensor_position,
        vd.distance_cm,
        vd.fill_percentage,
        vd.raw_reading,
        vd.timestamp
      FROM TrashBin tb
      JOIN Device d ON tb.trashbinId = d.trashbinId
      JOIN Sensor s ON d.deviceId = s.deviceId
      JOIN VolumeData vd ON s.sensorId = vd.sensorId
      WHERE tb.trashbinId = 'TB001'
        AND s.sensor_type = 'ultrasonic'
      ORDER BY d.category, s.sensor_position, vd.timestamp DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  // Get TB001 Weight Data for all waste categories
  static async getTB001WeightData() {
    const query = `
      SELECT
        tb.trashbinId,
        tb.name as trashbin_name,
        tb.location,
        d.deviceId,
        d.category as waste_category,
        s.sensorId,
        s.sensor_type,
        s.sensor_position,
        wd.weight_kg,
        wd.raw_reading,
        wd.timestamp
      FROM TrashBin tb
      JOIN Device d ON tb.trashbinId = d.trashbinId
      JOIN Sensor s ON d.deviceId = s.deviceId
      JOIN WeightData wd ON s.sensorId = wd.sensorId
      WHERE tb.trashbinId = 'TB001'
        AND s.sensor_type = 'load_cell'
      ORDER BY d.category, s.sensor_position, wd.timestamp DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  // Get TB001 Battery Percentage for all devices
  static async getTB001BatteryData() {
    const query = `
      SELECT
        tb.trashbinId,
        tb.name as trashbin_name,
        tb.location,
        d.deviceId,
        d.category as waste_category,
        dh.battery_percentage,
        dh.error_count_24h,
        dh.error_details,
        dh.timestamp
      FROM TrashBin tb
      JOIN Device d ON tb.trashbinId = d.trashbinId
      JOIN DeviceHealth dh ON d.deviceId = dh.deviceId
      WHERE tb.trashbinId = 'TB001'
      ORDER BY d.category, dh.timestamp DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  // Get TB001 Combined Data (Volume, Weight, Battery)
  static async getTB001CombinedData() {
    const query = `
      SELECT
        'Volume' as data_type,
        tb.trashbinId,
        d.category as waste_category,
        s.sensor_position::text as sensor_position,
        vd.fill_percentage,
        NULL::float as weight_kg,
        NULL::float as battery_percentage,
        vd.timestamp
      FROM TrashBin tb
      JOIN Device d ON tb.trashbinId = d.trashbinId
      JOIN Sensor s ON d.deviceId = s.deviceId
      JOIN VolumeData vd ON s.sensorId = vd.sensorId
      WHERE tb.trashbinId = 'TB001' AND s.sensor_type = 'ultrasonic'

      UNION ALL

      SELECT
        'Weight' as data_type,
        tb.trashbinId,
        d.category as waste_category,
        s.sensor_position::text as sensor_position,
        NULL::float as fill_percentage,
        wd.weight_kg,
        NULL::float as battery_percentage,
        wd.timestamp
      FROM TrashBin tb
      JOIN Device d ON tb.trashbinId = d.trashbinId
      JOIN Sensor s ON d.deviceId = s.deviceId
      JOIN WeightData wd ON s.sensorId = wd.sensorId
      WHERE tb.trashbinId = 'TB001' AND s.sensor_type = 'load_cell'

      UNION ALL

      SELECT
        'Battery' as data_type,
        tb.trashbinId,
        d.category as waste_category,
        'device'::text as sensor_position,
        NULL::float as fill_percentage,
        NULL::float as weight_kg,
        dh.battery_percentage,
        dh.timestamp
      FROM TrashBin tb
      JOIN Device d ON tb.trashbinId = d.trashbinId
      JOIN DeviceHealth dh ON d.deviceId = dh.deviceId
      WHERE tb.trashbinId = 'TB001'

      ORDER BY waste_category, timestamp DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = AnalyticsModel;