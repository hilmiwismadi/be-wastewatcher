const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'wastewatcher_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function testQueryPerformance() {
  try {
    console.log('Testing 5-minute interval query performance...\n');

    // Test with 1 hour of data
    const startTime = '2025-11-05 00:00:00';
    const endTime = '2025-11-05 00:59:59';

    console.log(`Date range: ${startTime} to ${endTime}\n`);

    // Start timer
    const start = Date.now();

    const query = `
      SELECT
        DATE_TRUNC('minute', wd.timestamp) +
        INTERVAL '5 minute' * FLOOR(EXTRACT(MINUTE FROM wd.timestamp) / 5) as time_interval,
        d.deviceid,
        d.category,
        COUNT(DISTINCT wd.weightdataid) as data_points,
        ROUND(AVG(wd.weight_kg)::numeric, 2) as avg_weight,
        0 as avg_volume
      FROM weightdata wd
      INNER JOIN sensor s ON wd.sensorid = s.sensorid
      INNER JOIN device d ON s.deviceid = d.deviceid
      WHERE wd.timestamp >= $1::timestamp
        AND wd.timestamp <= $2::timestamp
        AND d.trashbinid = 'TB_KANTIN_LT1'
      GROUP BY time_interval, d.deviceid, d.category
      ORDER BY time_interval, d.deviceid
      LIMIT 200
    `;

    const result = await pool.query(query, [startTime, endTime]);

    const end = Date.now();
    const duration = end - start;

    console.log(`Query completed in ${duration}ms`);
    console.log(`Returned ${result.rows.length} rows\n`);

    // Show first 5 and last 5 rows
    console.log('First 5 rows:');
    console.table(result.rows.slice(0, 5));

    console.log('\nLast 5 rows:');
    console.table(result.rows.slice(-5));

    // Show query plan
    console.log('\n--- Query Plan ---');
    const explainQuery = 'EXPLAIN ANALYZE ' + query;
    const explainResult = await pool.query(explainQuery, [startTime, endTime]);
    explainResult.rows.forEach(row => console.log(row['QUERY PLAN']));

    await pool.end();
    console.log('\nDatabase connection closed.');
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

testQueryPerformance();
