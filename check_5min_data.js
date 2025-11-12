const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'wastewatcher_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function check5MinData() {
  try {
    console.log('Checking 5-minute interval data for Kantin LT1...\n');

    // Get the latest data timestamp
    const latestQuery = `
      SELECT MAX(timestamp) as latest
      FROM weightdata wd
      JOIN sensor s ON wd.sensorid = s.sensorid
      JOIN device d ON s.deviceid = d.deviceid
      WHERE d.trashbinid = 'TB_KANTIN_LT1';
    `;
    const latestResult = await pool.query(latestQuery);
    const latestTimestamp = latestResult.rows[0].latest;
    console.log('Latest data timestamp:', latestTimestamp);

    const latestDate = new Date(latestTimestamp);
    const currentHour = latestDate.getHours();

    // Get data for the current hour with 5-minute intervals
    const hourStart = new Date(latestDate);
    hourStart.setMinutes(0, 0, 0);
    const hourEnd = new Date(hourStart);
    hourEnd.setHours(hourEnd.getHours() + 1);

    console.log(`\nChecking hour ${currentHour}:00 - ${currentHour}:59`);
    console.log(`Range: ${hourStart.toISOString()} to ${hourEnd.toISOString()}\n`);

    // Query to get 5-minute aggregated data
    const fiveMinQuery = `
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
        AND wd.timestamp < $2::timestamp
      GROUP BY time_interval, d.deviceid, d.category
      ORDER BY time_interval, d.deviceid
      LIMIT 50;
    `;

    const fiveMinResult = await pool.query(fiveMinQuery, [hourStart.toISOString(), hourEnd.toISOString()]);
    console.log('5-minute interval data:');
    console.log(fiveMinResult.rows);
    console.log(`\nTotal records: ${fiveMinResult.rows.length}`);

    // Check raw data for one device to see actual variation
    console.log('\n--- Raw data for one 5-minute interval ---\n');
    const rawQuery = `
      SELECT
        wd.timestamp,
        d.category,
        wd.weight_kg,
        vd.fill_percentage
      FROM weightdata wd
      JOIN sensor s ON wd.sensorid = s.sensorid
      JOIN device d ON s.deviceid = d.deviceid
      LEFT JOIN sensor vs ON vs.deviceid = d.deviceid AND vs.sensor_type = 'ultrasonic'
      LEFT JOIN volumedata vd ON vd.sensorid = vs.sensorid
        AND wd.timestamp = vd.timestamp
      WHERE d.trashbinid = 'TB_KANTIN_LT1'
        AND wd.timestamp >= $1::timestamp
        AND wd.timestamp < $1::timestamp + INTERVAL '5 minutes'
      ORDER BY wd.timestamp, d.category
      LIMIT 30;
    `;

    const rawResult = await pool.query(rawQuery, [hourStart.toISOString()]);
    console.log(`Raw data for ${hourStart.toISOString().substring(11, 16)} - ${new Date(hourStart.getTime() + 5*60000).toISOString().substring(11, 16)}:`);
    console.log(rawResult.rows);

    await pool.end();
    console.log('\nDatabase connection closed.');
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

check5MinData();
