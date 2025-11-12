const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'wastewatcher_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function testAggregation() {
  try {
    console.log('Testing aggregation of 5-minute interval data...\n');

    // Get data for one specific hour
    const startTime = '2025-11-05 00:00:00';
    const endTime = '2025-11-05 00:59:59';

    console.log(`Testing hour: ${startTime} to ${endTime}\n`);

    // Get 5-minute interval data (what API returns)
    const apiQuery = `
      SELECT
        DATE_TRUNC('minute', wd.timestamp) +
        INTERVAL '5 minute' * FLOOR(EXTRACT(MINUTE FROM wd.timestamp) / 5) as time_interval,
        d.deviceid,
        d.category,
        COUNT(DISTINCT wd.weightdataid) as data_points,
        ROUND(AVG(wd.weight_kg)::numeric, 2) as avg_weight,
        ROUND(AVG(vd.fill_percentage)::numeric, 2) as avg_volume
      FROM weightdata wd
      JOIN sensor s ON wd.sensorid = s.sensorid
      JOIN device d ON s.deviceid = d.deviceid
      LEFT JOIN sensor vs ON vs.deviceid = d.deviceid AND vs.sensor_type = 'ultrasonic'
      LEFT JOIN volumedata vd ON vd.sensorid = vs.sensorid
        AND DATE_TRUNC('minute', vd.timestamp) = DATE_TRUNC('minute', wd.timestamp)
      WHERE d.trashbinid = 'TB_KANTIN_LT1'
        AND wd.timestamp >= $1::timestamp
        AND wd.timestamp <= $2::timestamp
      GROUP BY time_interval, d.deviceid, d.category
      ORDER BY time_interval, d.deviceid;
    `;

    const apiResult = await pool.query(apiQuery, [startTime, endTime]);
    console.log('API Data (5-minute intervals):');
    console.log(`Total records: ${apiResult.rows.length}\n`);

    // Simulate frontend aggregation
    console.log('Simulating frontend aggregation (sum weights, avg volumes):\n');

    const grouped = {};
    apiResult.rows.forEach(row => {
      const timeKey = new Date(row.time_interval).toISOString();
      if (!grouped[timeKey]) {
        grouped[timeKey] = {
          time_interval: row.time_interval,
          count: 0,
          totalWeight: 0,
          totalVolume: 0,
          devices: []
        };
      }
      grouped[timeKey].count += 1;
      grouped[timeKey].totalWeight += parseFloat(row.avg_weight || 0);
      grouped[timeKey].totalVolume += parseFloat(row.avg_volume || 0);
      grouped[timeKey].devices.push(`${row.category}: ${row.avg_weight}kg`);
    });

    Object.values(grouped).forEach(data => {
      const avgVolume = data.count > 0 ? data.totalVolume / data.count : 0;
      const time = new Date(data.time_interval).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      console.log(`Time: ${time}`);
      console.log(`  Devices: ${data.devices.join(', ')}`);
      console.log(`  Total Weight: ${data.totalWeight.toFixed(2)} kg`);
      console.log(`  Avg Volume: ${avgVolume.toFixed(2)} %`);
      console.log('');
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

testAggregation();
