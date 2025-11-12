const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'wastewatcher_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function testFrontendDefault() {
  try {
    console.log('='.repeat(80));
    console.log('SIMULATING FRONTEND DEFAULT BEHAVIOR');
    console.log('='.repeat(80));

    // Frontend's getTimeRangeDate for 'fiveMinute' case:
    // Uses dummyEndDate = '2025-11-02'
    // Creates new Date(dummyEndDate) which is 2025-11-02 00:00:00 in local time
    // Then sets minutes to 0,0,0 (already 00:00:00)
    // formatTimeForInput uses getHours() which is 0
    // So frontend sends: 2025-11-02 00:00:00 to 2025-11-02 00:59:59

    const startDate = '2025-11-02 00:00:00';
    const endDate = '2025-11-02 00:59:59';

    console.log('\nFrontend calculates (for "Hourly" time period):');
    console.log(`  Start: ${startDate}`);
    console.log(`  End:   ${endDate}`);
    console.log('\nBackend receives this and subtracts 7 hours:');
    console.log('  Query range: 2025-11-01 17:00:00 to 2025-11-01 17:59:59 UTC\n');

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
      LIMIT 200;
    `;

    console.log('Executing query...');
    const result = await pool.query(query, [startDate, endDate]);

    console.log(`\nTotal rows: ${result.rows.length}`);

    // Group and aggregate by time interval (simulating frontend)
    const aggregated = {};
    result.rows.forEach(row => {
      const timestamp = row.time_interval;
      const timeKey = new Date(timestamp).toISOString();

      if (!aggregated[timeKey]) {
        const date = new Date(timestamp);
        // This is what frontend does now (after our fix):
        const wibTime = `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`;

        aggregated[timeKey] = {
          time_wib: wibTime,
          timestamp: timestamp,
          devices: [],
          totalWeight: 0
        };
      }

      aggregated[timeKey].devices.push({
        category: row.category,
        weight: parseFloat(row.avg_weight)
      });
      aggregated[timeKey].totalWeight += parseFloat(row.avg_weight || 0);
    });

    const chartData = Object.values(aggregated);

    console.log(`Aggregated chart points: ${chartData.length}\n`);

    console.log('='.repeat(80));
    console.log('CHART DATA POINTS:');
    console.log('='.repeat(80));

    chartData.forEach((item, i) => {
      console.log(`${i + 1}. Time: ${item.time_wib} | Weight: ${item.totalWeight.toFixed(2)}kg`);
    });

    console.log('\n' + '='.repeat(80));
    if (chartData.length === 12) {
      console.log('✓ SUCCESS: All 12 intervals present!');
    } else if (chartData.length === 2) {
      console.log('✗ PROBLEM: Only 2 intervals! User will see stuck tooltip.');
    } else {
      console.log(`⚠ UNEXPECTED: ${chartData.length} intervals (expected 12)`);
    }
    console.log('='.repeat(80));

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

testFrontendDefault();
