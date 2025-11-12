const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'wastewatcher_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function testActualRequest() {
  try {
    console.log('='.repeat(80));
    console.log('TESTING WHAT FRONTEND IS ACTUALLY SENDING');
    console.log('='.repeat(80));

    // The frontend is probably sending the current hour in WIB
    // Let's test with what the user is actually seeing (07:00-07:59)
    const startDate = '2025-11-02 07:00:00';  // What user might be sending
    const endDate = '2025-11-02 07:59:59';

    console.log('\nScenario: User selects "Hourly" time period');
    console.log(`Frontend sends: ${startDate} to ${endDate}`);
    console.log('Backend should convert this WIB time to UTC and query...\n');

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

    console.log(`\nTotal rows returned: ${result.rows.length}`);

    // Group by time interval
    const byInterval = {};
    result.rows.forEach(row => {
      const time = new Date(row.time_interval).toISOString();
      if (!byInterval[time]) {
        byInterval[time] = [];
      }
      byInterval[time].push(row);
    });

    console.log(`Unique time intervals: ${Object.keys(byInterval).length}\n`);

    console.log('='.repeat(80));
    console.log('TIME INTERVALS RETURNED:');
    console.log('='.repeat(80));

    Object.keys(byInterval).sort().forEach(time => {
      const date = new Date(time);
      const utcTime = `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`;
      const devices = byInterval[time].map(r => `${r.category.slice(0,3)}:${r.avg_weight}kg`).join(', ');
      console.log(`  ${utcTime} - ${devices}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('WHAT USER SHOULD SEE:');
    console.log('='.repeat(80));
    console.log('If user selected 07:00-07:59, they should see intervals at:');
    console.log('  00:00, 00:05, 00:10, 00:15, 00:20, 00:25, 00:30, 00:35, 00:40, 00:45, 00:50, 00:55');
    console.log('(Because DB stores 00:00 UTC which is 07:00 WIB)\n');

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

testActualRequest();
