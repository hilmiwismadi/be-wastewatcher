const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'wastewatcher_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function checkDataFrequency() {
  try {
    console.log('Connecting to database...\n');

    // First, find the Kantin LT1 bin
    const binQuery = `
      SELECT trashbinid, name
      FROM trashbin
      WHERE name ILIKE '%kantin%'
      ORDER BY name
      LIMIT 10;
    `;
    const binResult = await pool.query(binQuery);
    console.log('Available bins with "kantin" in name:');
    console.log(binResult.rows);
    console.log('\n');

    if (binResult.rows.length === 0) {
      console.log('No bins found with "kantin" in the name');
      await pool.end();
      return;
    }

    // Use the first kantin bin found
    const kantinBin = binResult.rows[0];
    console.log(`Using bin: ${kantinBin.name} (${kantinBin.trashbinid})\n`);

    // Get devices for this bin
    const devicesQuery = `
      SELECT deviceid, category
      FROM device
      WHERE trashbinid = $1;
    `;
    const devicesResult = await pool.query(devicesQuery, [kantinBin.trashbinid]);
    console.log('Devices in this bin:');
    console.log(devicesResult.rows);
    console.log('\n');

    // Check weight data frequency for each device between 00:00 and 01:00 on 2025-01-11
    console.log('Checking data frequency between 00:00 and 01:00 on 2025-01-11:\n');

    for (const device of devicesResult.rows) {
      const dataQuery = `
        SELECT
          COUNT(*) as total_records,
          MIN(wd.timestamp) as first_record,
          MAX(wd.timestamp) as last_record,
          COUNT(DISTINCT DATE_TRUNC('minute', wd.timestamp)) as unique_minutes,
          COUNT(DISTINCT DATE_TRUNC('second', wd.timestamp)) as unique_seconds
        FROM weightdata wd
        JOIN sensor s ON wd.sensorid = s.sensorid
        WHERE s.deviceid = $1
          AND wd.timestamp >= '2025-01-11 00:00:00'::timestamp
          AND wd.timestamp < '2025-01-11 01:00:00'::timestamp;
      `;
      const dataResult = await pool.query(dataQuery, [device.deviceid]);

      console.log(`Device: ${device.deviceid} (${device.category})`);
      console.log(dataResult.rows[0]);
      console.log('\n');

      // Get sample records
      const sampleQuery = `
        SELECT
          wd.timestamp,
          wd.weight_kg,
          s.sensor_type,
          s.sensor_position
        FROM weightdata wd
        JOIN sensor s ON wd.sensorid = s.sensorid
        WHERE s.deviceid = $1
          AND wd.timestamp >= '2025-01-11 00:00:00'::timestamp
          AND wd.timestamp < '2025-01-11 01:00:00'::timestamp
        ORDER BY wd.timestamp
        LIMIT 10;
      `;
      const sampleResult = await pool.query(sampleQuery, [device.deviceid]);
      console.log(`Sample records (first 10) for ${device.category}:`);
      console.log(sampleResult.rows);
      console.log('\n---\n');
    }

    // Check the hourly aggregated data from the API endpoint
    console.log('Checking hourly aggregated data (what the API returns):\n');
    const hourlyQuery = `
      SELECT
        DATE_TRUNC('hour', wd.timestamp) as time_interval,
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
        AND DATE_TRUNC('hour', vd.timestamp) = DATE_TRUNC('hour', wd.timestamp)
      WHERE d.trashbinid = $1
        AND wd.timestamp >= '2025-01-11 00:00:00'::timestamp
        AND wd.timestamp <= '2025-01-11 01:00:00'::timestamp
      GROUP BY time_interval, d.deviceid, d.category
      ORDER BY time_interval, d.deviceid;
    `;
    const hourlyResult = await pool.query(hourlyQuery, [kantinBin.trashbinid]);
    console.log('Hourly aggregated data (API format):');
    console.log(hourlyResult.rows);

    await pool.end();
    console.log('\nDatabase connection closed.');
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

checkDataFrequency();
