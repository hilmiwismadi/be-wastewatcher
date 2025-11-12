const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'wastewatcher_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function testNewQuery() {
  try {
    console.log('Testing new timezone-aware query...\n');

    // User selects: 11/02/2025 00:00-00:59 (WIB)
    const startDate = '2025-11-02 00:00:00';
    const endDate = '2025-11-02 00:59:59';

    console.log(`Frontend sends (WIB): ${startDate} to ${endDate}\n`);

    const query = `
      SELECT
        (DATE_TRUNC('hour', wd.timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta') +
         INTERVAL '5 minute' * FLOOR(EXTRACT(MINUTE FROM (wd.timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta')) / 5))
         AT TIME ZONE 'Asia/Jakarta' AT TIME ZONE 'UTC' as time_interval,
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

    const result = await pool.query(query, [startDate, endDate]);

    console.log(`Total records: ${result.rows.length}\n`);

    // Aggregate by timestamp
    const aggregated = {};
    result.rows.forEach(row => {
      const utcTime = new Date(row.time_interval);
      const wibTime = new Date(utcTime.getTime() + (7 * 60 * 60 * 1000));
      const timeKey = utcTime.toISOString();

      if (!aggregated[timeKey]) {
        aggregated[timeKey] = {
          utc: utcTime.toISOString(),
          wibDisplay: wibTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'UTC'
          }).replace(/^24/, '00'),
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

    console.log('=== Chart Data Points (12 intervals) ===\n');

    const chartData = Object.values(aggregated).map((item, index) => ({
      index: index + 1,
      time: item.wibDisplay,
      utc: item.utc,
      devices: item.devices.map(d => `${d.category}: ${d.weight}kg`).join(', '),
      totalWeight: item.totalWeight.toFixed(2)
    }));

    console.table(chartData);

    console.log(`\n✓ Total chart points: ${chartData.length}`);
    console.log(`✓ Expected: 12 points (00:00, 00:05, 00:10, ..., 00:55)`);

    // Verify intervals
    const times = chartData.map(d => d.time);
    console.log(`\n✓ X-axis times: ${times.join(', ')}`);

    await pool.end();
    console.log('\nDatabase connection closed.');
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

testNewQuery();
