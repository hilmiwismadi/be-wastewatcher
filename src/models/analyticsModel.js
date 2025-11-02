const { pool } = require('../config/database');

class AnalyticsModel {
  // Get dashboard overview statistics
  static async getDashboardOverview() {
    const query = `
      SELECT
        COUNT(DISTINCT tb.trashbinid) as total_bins,
        COUNT(DISTINCT d.deviceid) as total_devices,
        COUNT(DISTINCT d.deviceid) FILTER (WHERE d.status = 'active') as active_devices,
        COUNT(DISTINCT bs.binStatusId) FILTER (WHERE bs.status IN ('full', 'overflowing')) as bins_need_collection,
        ROUND(AVG(bs.average_volume_percentage)::numeric, 1) as avg_fill_percentage,
        ROUND(AVG(dh.battery_percentage)::numeric, 1) as avg_battery_level,
        COUNT(DISTINCT al.alertId) FILTER (WHERE al.resolved_at IS NULL) as active_alerts
      FROM trashbin tb
      LEFT JOIN device d ON tb.trashbinid = d.trashbinid
      LEFT JOIN binstatus bs ON d.deviceid = bs.deviceid
      LEFT JOIN devicehealth dh ON d.deviceid = dh.deviceid AND dh.timestamp = (
        SELECT MAX(timestamp) FROM devicehealth WHERE deviceid = d.deviceid
      )
      LEFT JOIN alertlog al ON d.deviceid = al.deviceid
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
      FROM device d
      LEFT JOIN binstatus bs ON d.deviceid = bs.deviceid
      LEFT JOIN wastecategory wc ON d.category = wc.category_name
      WHERE d.status = 'active'
      GROUP BY d.category, wc.color_code
      ORDER BY device_count DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  // Get hourly waste patterns for the last 24 hours
  static async getHourlyWastePatterns(deviceid = null, category = null) {
    let whereClause = "WHERE wd.timestamp >= NOW() - INTERVAL '24 hours'";
    const params = [];
    let paramCount = 1;

    if (deviceid) {
      whereClause += ` AND d.deviceid = $${paramCount}`;
      params.push(deviceid);
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
      FROM weightdata wd
      JOIN sensor s ON wd.sensorid = s.sensorid
      JOIN device d ON s.deviceid = d.deviceid
      ${whereClause}
      GROUP BY EXTRACT(HOUR FROM wd.timestamp)
      ORDER BY hour
    `;

    const result = await pool.query(query, params);
    return result.rows;
  }

  // Get data by 5-minute intervals (for hourly view)
  static async getFiveMinuteIntervalData(deviceid = null, category = null, startDate = null, endDate = null) {
    let whereClause = "WHERE wd.timestamp >= NOW() - INTERVAL '24 hours'";
    const params = [];
    let paramCount = 1;

    if (startDate && endDate) {
      whereClause = `WHERE wd.timestamp >= $${paramCount} AND wd.timestamp <= $${paramCount + 1}`;
      params.push(startDate, endDate);
      paramCount += 2;
    }

    if (deviceid) {
      whereClause += ` AND d.deviceid = $${paramCount}`;
      params.push(deviceid);
      paramCount++;
    }

    if (category) {
      whereClause += ` AND d.category = $${paramCount}`;
      params.push(category);
    }

    const query = `
      SELECT
        DATE_TRUNC('minute', wd.timestamp) +
        INTERVAL '5 minute' * FLOOR(EXTRACT(MINUTE FROM wd.timestamp) / 5) as time_interval,
        COUNT(*) as data_points,
        ROUND(AVG(wd.weight_kg)::numeric, 2) as avg_weight,
        ROUND(AVG(vd.fill_percentage)::numeric, 2) as avg_volume
      FROM weightdata wd
      JOIN sensor s ON wd.sensorid = s.sensorid
      JOIN device d ON s.deviceid = d.deviceid
      LEFT JOIN volumedata vd ON s.sensorid = vd.sensorid
        AND DATE_TRUNC('minute', vd.timestamp) = DATE_TRUNC('minute', wd.timestamp)
      ${whereClause}
      GROUP BY time_interval
      ORDER BY time_interval
    `;

    const result = await pool.query(query, params);
    return result.rows;
  }

  // Get data by hourly intervals (for daily view)
  static async getHourlyIntervalData(deviceid = null, category = null, startDate = null, endDate = null) {
    let whereClause = "WHERE wd.timestamp >= NOW() - INTERVAL '7 days'";
    const params = [];
    let paramCount = 1;

    if (startDate && endDate) {
      whereClause = `WHERE wd.timestamp >= $${paramCount} AND wd.timestamp <= $${paramCount + 1}`;
      params.push(startDate, endDate);
      paramCount += 2;
    }

    if (deviceid) {
      whereClause += ` AND d.deviceid = $${paramCount}`;
      params.push(deviceid);
      paramCount++;
    }

    if (category) {
      whereClause += ` AND d.category = $${paramCount}`;
      params.push(category);
    }

    const query = `
      SELECT
        DATE_TRUNC('hour', wd.timestamp) as time_interval,
        COUNT(DISTINCT wd.weightdataid) as data_points,
        ROUND(AVG(wd.weight_kg)::numeric, 2) as avg_weight,
        ROUND(AVG(vd.fill_percentage)::numeric, 2) as avg_volume
      FROM weightdata wd
      JOIN sensor s ON wd.sensorid = s.sensorid
      JOIN device d ON s.deviceid = d.deviceid
      LEFT JOIN sensor vs ON vs.deviceid = d.deviceid AND vs.sensor_type = 'ultrasonic'
      LEFT JOIN volumedata vd ON vd.sensorid = vs.sensorid
        AND DATE_TRUNC('hour', vd.timestamp) = DATE_TRUNC('hour', wd.timestamp)
      ${whereClause}
      GROUP BY time_interval
      ORDER BY time_interval
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
      FROM dailyanalytics da
      JOIN device d ON da.deviceid = d.deviceid
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
      FROM binstatus bs
      JOIN device d ON bs.deviceid = d.deviceid
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
        COUNT(DISTINCT tb.trashbinid) as bin_count,
        COUNT(DISTINCT d.deviceid) as device_count,
        ROUND(AVG(bs.average_volume_percentage)::numeric, 1) as avg_fill_percentage,
        ROUND(AVG(bs.total_weight_kg)::numeric, 2) as avg_weight,
        COUNT(CASE WHEN bs.status IN ('full', 'overflowing') THEN 1 END) as bins_need_collection
      FROM trashbin tb
      LEFT JOIN device d ON tb.trashbinid = d.trashbinid
      LEFT JOIN binstatus bs ON d.deviceid = bs.deviceid
      WHERE tb.status = 'active' AND tb.area IS NOT NULL
      GROUP BY tb.area
      ORDER BY avg_fill_percentage DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  // Get real-time sensor data for charts
  static async getRealTimeData(deviceid, hours = 24) {
    const query = `
      SELECT
        'weight' as data_type,
        wd.timestamp,
        wd.weight_kg as value,
        s.sensor_position
      FROM weightdata wd
      JOIN sensor s ON wd.sensorid = s.sensorid
      WHERE s.deviceid = $1 AND wd.timestamp >= NOW() - INTERVAL '${hours} hours'

      UNION ALL

      SELECT
        'volume' as data_type,
        vd.timestamp,
        vd.fill_percentage as value,
        s.sensor_position
      FROM volumedata vd
      JOIN sensor s ON vd.sensorid = s.sensorid
      WHERE s.deviceid = $1 AND vd.timestamp >= NOW() - INTERVAL '${hours} hours'

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
        COUNT(DISTINCT da.deviceid) as active_devices,
        ROUND(AVG(da.collection_frequency)::numeric, 2) as avg_collections_per_device,
        STRING_AGG(DISTINCT d.category, ', ') as categories_collected
      FROM dailyanalytics da
      JOIN device d ON da.deviceid = d.deviceid
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
        COUNT(DISTINCT dh.deviceid) as devices_reporting
      FROM devicehealth dh
      JOIN device d ON dh.deviceid = d.deviceid
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
      FROM alertlog
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
        tb.trashbinid,
        tb.name as trashbin_name,
        tb.location,
        d.deviceid,
        d.category as waste_category,
        s.sensorid,
        s.sensor_type,
        s.sensor_position,
        vd.distance_cm,
        vd.fill_percentage,
        vd.raw_reading,
        vd.timestamp
      FROM trashbin tb
      JOIN device d ON tb.trashbinid = d.trashbinid
      JOIN sensor s ON d.deviceid = s.deviceid
      JOIN volumedata vd ON s.sensorid = vd.sensorid
      WHERE tb.trashbinid = 'TB001'
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
        tb.trashbinid,
        tb.name as trashbin_name,
        tb.location,
        d.deviceid,
        d.category as waste_category,
        s.sensorid,
        s.sensor_type,
        s.sensor_position,
        wd.weight_kg,
        wd.raw_reading,
        wd.timestamp
      FROM trashbin tb
      JOIN device d ON tb.trashbinid = d.trashbinid
      JOIN sensor s ON d.deviceid = s.deviceid
      JOIN weightdata wd ON s.sensorid = wd.sensorid
      WHERE tb.trashbinid = 'TB001'
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
        tb.trashbinid,
        tb.name as trashbin_name,
        tb.location,
        d.deviceid,
        d.category as waste_category,
        dh.battery_percentage,
        dh.error_count_24h,
        dh.error_details,
        dh.timestamp
      FROM trashbin tb
      JOIN device d ON tb.trashbinid = d.trashbinid
      JOIN devicehealth dh ON d.deviceid = dh.deviceid
      WHERE tb.trashbinid = 'TB001'
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
        tb.trashbinid,
        d.category as waste_category,
        s.sensor_position::text as sensor_position,
        vd.fill_percentage,
        NULL::float as weight_kg,
        NULL::float as battery_percentage,
        vd.timestamp
      FROM trashbin tb
      JOIN device d ON tb.trashbinid = d.trashbinid
      JOIN sensor s ON d.deviceid = s.deviceid
      JOIN volumedata vd ON s.sensorid = vd.sensorid
      WHERE tb.trashbinid = 'TB001' AND s.sensor_type = 'ultrasonic'

      UNION ALL

      SELECT
        'Weight' as data_type,
        tb.trashbinid,
        d.category as waste_category,
        s.sensor_position::text as sensor_position,
        NULL::float as fill_percentage,
        wd.weight_kg,
        NULL::float as battery_percentage,
        wd.timestamp
      FROM trashbin tb
      JOIN device d ON tb.trashbinid = d.trashbinid
      JOIN sensor s ON d.deviceid = s.deviceid
      JOIN weightdata wd ON s.sensorid = wd.sensorid
      WHERE tb.trashbinid = 'TB001' AND s.sensor_type = 'load_cell'

      UNION ALL

      SELECT
        'Battery' as data_type,
        tb.trashbinid,
        d.category as waste_category,
        'device'::text as sensor_position,
        NULL::float as fill_percentage,
        NULL::float as weight_kg,
        dh.battery_percentage,
        dh.timestamp
      FROM trashbin tb
      JOIN device d ON tb.trashbinid = d.trashbinid
      JOIN devicehealth dh ON d.deviceid = dh.deviceid
      WHERE tb.trashbinid = 'TB001'

      ORDER BY waste_category, timestamp DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  // Get aggregated current weight and volume for all bins (for monitoring dashboard)
  static async getAggregatedComposition() {
    const query = `
      WITH latest_status AS (
        SELECT DISTINCT ON (bs.deviceid)
          bs.deviceid,
          d.category,
          bs.total_weight_kg,
          bs.average_volume_percentage
        FROM binstatus bs
        JOIN device d ON bs.deviceid = d.deviceid
        WHERE d.status = 'active'
        ORDER BY bs.deviceid, bs.last_updated DESC
      )
      SELECT
        d.category,
        COUNT(DISTINCT d.trashbinid) as bin_count,
        ROUND(SUM(ls.total_weight_kg)::numeric, 2) as total_weight,
        ROUND(AVG(ls.total_weight_kg)::numeric, 2) as avg_weight_per_bin,
        ROUND(AVG(ls.average_volume_percentage)::numeric, 1) as avg_volume_percentage
      FROM device d
      LEFT JOIN latest_status ls ON d.deviceid = ls.deviceid
      WHERE d.status = 'active'
      GROUP BY d.category
      ORDER BY d.category
    `;

    const result = await pool.query(query);

    // Calculate totals and format response
    const data = result.rows;
    const totalWeight = data.reduce((sum, row) => sum + parseFloat(row.total_weight || 0), 0);
    const totalVolume = data.reduce((sum, row) => sum + parseFloat(row.avg_volume_percentage || 0), 0);
    const categoryCount = data.length;

    return {
      categories: data,
      summary: {
        total_weight: Math.round(totalWeight * 100) / 100,
        avg_volume_percentage: categoryCount > 0 ? Math.round((totalVolume / categoryCount) * 10) / 10 : 0,
        total_bins: data.reduce((sum, row) => sum + parseInt(row.bin_count || 0), 0)
      }
    };
  }
}

module.exports = AnalyticsModel;