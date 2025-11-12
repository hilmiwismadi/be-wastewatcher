const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'wastewatcher_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function checkSpecificData() {
  try {
    console.log('Checking data for 11/02/2025 00:00 to 01:00...\n');

    // Check with different date formats to understand timezone issues
    const testDates = [
      { label: 'UTC 2025-11-02 00:00 to 01:00', start: '2025-11-02 00:00:00', end: '2025-11-02 01:00:00' },
      { label: 'UTC 2025-11-01 17:00 to 18:00 (WIB 00:00-01:00)', start: '2025-11-01 17:00:00', end: '2025-11-01 18:00:00' },
    ];

    for (const testDate of testDates) {
      console.log(`\n=== ${testDate.label} ===\n`);

      // Count total records
      const countQuery = `
        SELECT COUNT(*) as total_records
        FROM weightdata wd
        JOIN sensor s ON wd.sensorid = s.sensorid
        JOIN device d ON s.deviceid = d.deviceid
        WHERE d.trashbinid = 'TB_KANTIN_LT1'
          AND wd.timestamp >= $1::timestamp
          AND wd.timestamp < $2::timestamp;
      `;

      const countResult = await pool.query(countQuery, [testDate.start, testDate.end]);
      console.log(`Total weightdata records: ${countResult.rows[0].total_records}`);

      // Get 5-minute aggregated data
      const aggregateQuery = `
        SELECT
          DATE_TRUNC('minute', wd.timestamp) +
          INTERVAL '5 minute' * FLOOR(EXTRACT(MINUTE FROM wd.timestamp) / 5) as time_interval,
          d.deviceid,
          d.category,
          COUNT(DISTINCT wd.weightdataid) as data_points,
          ROUND(AVG(wd.weight_kg)::numeric, 2) as avg_weight
        FROM weightdata wd
        INNER JOIN sensor s ON wd.sensorid = s.sensorid
        INNER JOIN device d ON s.deviceid = d.deviceid
        WHERE d.trashbinid = 'TB_KANTIN_LT1'
          AND wd.timestamp >= $1::timestamp
          AND wd.timestamp < $2::timestamp
        GROUP BY time_interval, d.deviceid, d.category
        ORDER BY time_interval, d.deviceid;
      `;

      const aggResult = await pool.query(aggregateQuery, [testDate.start, testDate.end]);
      console.log(`\n5-minute aggregated records: ${aggResult.rows.length}\n`);

      if (aggResult.rows.length > 0) {
        console.log('First 10 aggregated records:');
        console.table(aggResult.rows.slice(0, 10));

        // Simulate frontend aggregation (sum weights per timestamp)
        console.log('\nFrontend Aggregation (Total per timestamp):');
        const frontendAgg = {};
        aggResult.rows.forEach(row => {
          const timeKey = new Date(row.time_interval).toISOString();
          if (!frontendAgg[timeKey]) {
            frontendAgg[timeKey] = {
              time: new Date(row.time_interval).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
              timestamp: row.time_interval,
              devices: 0,
              totalWeight: 0,
              deviceBreakdown: []
            };
          }
          frontendAgg[timeKey].devices += 1;
          frontendAgg[timeKey].totalWeight += parseFloat(row.avg_weight || 0);
          frontendAgg[timeKey].deviceBreakdown.push(`${row.category}: ${row.avg_weight}kg`);
        });

        const frontendResults = Object.values(frontendAgg).slice(0, 10);
        frontendResults.forEach(item => {
          console.log(`\nTime: ${item.time} (${item.timestamp})`);
          console.log(`  Devices: ${item.devices}`);
          console.log(`  Device breakdown: ${item.deviceBreakdown.join(', ')}`);
          console.log(`  Total Weight: ${item.totalWeight.toFixed(2)} kg`);
        });

        console.log(`\n... and ${Object.keys(frontendAgg).length - 10} more intervals`);
        console.log(`Total unique time intervals: ${Object.keys(frontendAgg).length}`);
      } else {
        console.log('No data found for this time range!');
      }
    }

    // Check what's the latest data timestamp
    console.log('\n\n=== Latest Data Timestamp ===\n');
    const latestQuery = `
      SELECT
        MAX(wd.timestamp) as latest_timestamp,
        MAX(wd.timestamp) AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta' as latest_wib
      FROM weightdata wd
      JOIN sensor s ON wd.sensorid = s.sensorid
      JOIN device d ON s.deviceid = d.deviceid
      WHERE d.trashbinid = 'TB_KANTIN_LT1';
    `;
    const latestResult = await pool.query(latestQuery);
    console.log('Latest data in database:');
    console.log(latestResult.rows[0]);

    await pool.end();
    console.log('\n\nDatabase connection closed.');
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

checkSpecificData();
