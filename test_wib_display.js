const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'wastewatcher_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function testWibDisplay() {
  try {
    const startDate = '2025-11-02 00:00:00';
    const endDate = '2025-11-02 00:59:59';

    const query = `
      WITH intervals AS (
        SELECT
          DATE_TRUNC('hour', wd.timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta') +
          INTERVAL '5 minute' * FLOOR(EXTRACT(MINUTE FROM (wd.timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta')) / 5) as wib_interval,
          wd.timestamp,
          wd.weightdataid,
          wd.weight_kg,
          d.deviceid,
          d.category
        FROM weightdata wd
        INNER JOIN sensor s ON wd.sensorid = s.sensorid
        INNER JOIN device d ON s.deviceid = d.deviceid
        WHERE wd.timestamp >= ($1::timestamp - INTERVAL '7 hours')
          AND wd.timestamp <= ($2::timestamp - INTERVAL '7 hours')
          AND d.trashbinid = 'TB_KANTIN_LT1'
      )
      SELECT
        wib_interval as time_interval,
        TO_CHAR(wib_interval, 'HH24:MI') as wib_time_display,
        deviceid,
        category,
        COUNT(DISTINCT weightdataid) as data_points,
        ROUND(AVG(weight_kg)::numeric, 2) as avg_weight,
        0 as avg_volume
      FROM intervals
      GROUP BY wib_interval, deviceid, category
      ORDER BY wib_interval, deviceid
      LIMIT 200
    `;

    console.log('Testing new query with wib_time_display field...\n');
    const result = await pool.query(query, [startDate, endDate]);

    console.log(`Total rows: ${result.rows.length}\n`);

    // Group by wib_time_display
    const byTime = {};
    result.rows.forEach(row => {
      const time = row.wib_time_display;
      if (!byTime[time]) {
        byTime[time] = [];
      }
      byTime[time].push(row);
    });

    console.log('='.repeat(80));
    console.log('RESULTS WITH WIB_TIME_DISPLAY:');
    console.log('='.repeat(80));

    Object.keys(byTime).sort().forEach(time => {
      const devices = byTime[time].map(r => `${r.category.slice(0,3)}:${r.avg_weight}kg`).join(', ');
      console.log(`  ${time} - ${devices}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('VERIFICATION:');
    console.log('='.repeat(80));

    const times = Object.keys(byTime).sort();
    console.log(`\nUnique intervals: ${times.length}`);
    console.log(`Times: ${times.join(', ')}`);

    const expected = ['00:00', '00:05', '00:10', '00:15', '00:20', '00:25', '00:30', '00:35', '00:40', '00:45', '00:50', '00:55'];
    const matches = expected.every(t => times.includes(t));

    if (matches) {
      console.log('\n✓ ALL 12 EXPECTED INTERVALS PRESENT!');
      console.log('✓ wib_time_display field is correctly formatted!');
    } else {
      console.log('\n✗ MISSING SOME INTERVALS!');
      console.log(`  Expected: ${expected.join(', ')}`);
      console.log(`  Got:      ${times.join(', ')}`);
    }

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

testWibDisplay();
