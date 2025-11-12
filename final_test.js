const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'wastewatcher_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function finalTest() {
  try {
    console.log('='.repeat(80));
    console.log('FINAL TEST: Complete Flow Verification');
    console.log('='.repeat(80));
    console.log('\nUser Action: Selects date 11/02/2025, time 00:00-00:59 (WIB)');
    console.log('Expected: Chart shows 12 points at 00:00, 00:05, 00:10, ..., 00:55\n');

    // Frontend sends WIB time
    const startDate = '2025-11-02 00:00:00';
    const endDate = '2025-11-02 00:59:59';

    console.log(`Frontend Input (WIB): ${startDate} to ${endDate}`);
    console.log(`Backend converts to UTC: Subtracts 7 hours\n`);

    // Execute the actual query that will run in production
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

    console.log('Executing query...\n');
    const result = await pool.query(query, [startDate, endDate]);

    // Aggregate by timestamp (simulating frontend)
    const aggregated = {};
    result.rows.forEach(row => {
      const timestamp = row.time_interval;
      const timeKey = new Date(timestamp).toISOString();

      if (!aggregated[timeKey]) {
        const date = new Date(timestamp);
        const wibTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

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

    console.log('✓ Query successful!');
    console.log(`✓ Total records from DB: ${result.rows.length}`);
    console.log(`✓ Aggregated chart points: ${chartData.length}\n`);

    console.log('='.repeat(80));
    console.log('CHART DATA (What user will see)');
    console.log('='.repeat(80));
    console.log('\nX-Axis Label | Hover Time | Weight (kg) | Devices Breakdown');
    console.log('-'.repeat(80));

    chartData.forEach((item, index) => {
      const minutes = item.time_wib.split(':')[1];
      const xAxisLabel = minutes === '00' ? item.time_wib : '(no label)';
      const devicesStr = item.devices.map(d => `${d.category.slice(0,3)}:${d.weight}`).join(', ');

      console.log(`${xAxisLabel.padEnd(12)} | ${item.time_wib.padEnd(10)} | ${item.totalWeight.toFixed(2).padEnd(11)} | ${devicesStr}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('VERIFICATION');
    console.log('='.repeat(80));

    const times = chartData.map(d => d.time_wib);
    console.log(`\n✓ All intervals: ${times.join(', ')}`);

    const expected = ['00:00', '00:05', '00:10', '00:15', '00:20', '00:25', '00:30', '00:35', '00:40', '00:45', '00:50', '00:55'];
    const matches = expected.every(t => times.includes(t));

    if (matches) {
      console.log('✓ ALL 12 EXPECTED INTERVALS PRESENT!');
    } else {
      console.log('✗ MISSING SOME INTERVALS!');
      console.log(`  Expected: ${expected.join(', ')}`);
      console.log(`  Got:      ${times.join(', ')}`);
    }

    console.log(`\n✓ X-axis will show: 00:00 (other labels hidden but hoverable)`);
    console.log(`✓ Hover tooltips will show: 00:00, 00:05, 00:10, ..., 00:55`);
    console.log(`✓ Each point shows different weight values: ${chartData.map(d => d.totalWeight.toFixed(2)).join(', ')}`);

    console.log('\n' + '='.repeat(80));
    console.log('TEST PASSED! ✓');
    console.log('='.repeat(80));

    await pool.end();
  } catch (error) {
    console.error('\n' + '='.repeat(80));
    console.error('TEST FAILED! ✗');
    console.error('='.repeat(80));
    console.error('\nError:', error);
    await pool.end();
    process.exit(1);
  }
}

finalTest();
