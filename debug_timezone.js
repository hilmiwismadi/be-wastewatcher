const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'wastewatcher_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function debugTimezone() {
  try {
    const startDate = '2025-11-02 07:00:00';
    const endDate = '2025-11-02 07:59:59';

    const query = `
      SELECT
        DATE_TRUNC('hour', wd.timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta') +
        INTERVAL '5 minute' * FLOOR(EXTRACT(MINUTE FROM (wd.timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta')) / 5) as time_interval,
        d.deviceid,
        d.category,
        COUNT(DISTINCT wd.weightdataid) as data_points,
        ROUND(AVG(wd.weight_kg)::numeric, 2) as avg_weight
      FROM weightdata wd
      INNER JOIN sensor s ON wd.sensorid = s.sensorid
      INNER JOIN device d ON s.deviceid = d.deviceid
      WHERE wd.timestamp >= ($1::timestamp - INTERVAL '7 hours')
        AND wd.timestamp <= ($2::timestamp - INTERVAL '7 hours')
        AND d.trashbinid = 'TB_KANTIN_LT1'
      GROUP BY time_interval, d.deviceid, d.category
      ORDER BY time_interval, d.deviceid
      LIMIT 10;
    `;

    console.log('Querying for WIB range:', startDate, 'to', endDate);
    console.log('This means UTC range:', '2025-11-02 00:00:00 to 2025-11-02 00:59:59\n');

    const result = await pool.query(query, [startDate, endDate]);

    console.log('Raw results from database:');
    console.log('='.repeat(100));
    result.rows.forEach((row, i) => {
      console.log(`\nRow ${i + 1}:`);
      console.log('  time_interval raw:', row.time_interval);
      console.log('  time_interval type:', typeof row.time_interval);
      console.log('  time_interval toString:', row.time_interval.toString());
      console.log('  category:', row.category);
      console.log('  avg_weight:', row.avg_weight);

      // Simulate what JavaScript Date does
      const jsDate = new Date(row.time_interval);
      console.log('  JS Date parsing:', jsDate.toISOString());
      console.log('  JS getHours():', jsDate.getHours());
      console.log('  JS getMinutes():', jsDate.getMinutes());
      console.log('  JS getUTCHours():', jsDate.getUTCHours());
      console.log('  JS getUTCMinutes():', jsDate.getUTCMinutes());
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

debugTimezone();
