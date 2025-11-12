const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'wastewatcher_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function testVolumeData() {
  try {
    console.log('='.repeat(80));
    console.log('TESTING VOLUME DATA AVAILABILITY');
    console.log('='.repeat(80));

    // Test for 1 hour: 2025-11-02 00:00-00:59 WIB = 2025-11-01 17:00-17:59 UTC
    const startDate = '2025-11-02 00:00:00';
    const endDate = '2025-11-02 00:59:59';

    console.log(`\nTesting time range (WIB): ${startDate} to ${endDate}`);
    console.log('Converted to UTC: 2025-11-01 17:00:00 to 2025-11-01 17:59:59\n');

    // First, check raw volume data count
    const rawVolumeQuery = `
      SELECT
        COUNT(*) as total_volume_records,
        COUNT(DISTINCT vd.volumedataid) as unique_volume_records,
        MIN(vd.timestamp) as earliest_timestamp,
        MAX(vd.timestamp) as latest_timestamp
      FROM volumedata vd
      INNER JOIN sensor s ON vd.sensorid = s.sensorid
      INNER JOIN device d ON s.deviceid = d.deviceid
      WHERE vd.timestamp >= ($1::timestamp - INTERVAL '7 hours')
        AND vd.timestamp <= ($2::timestamp - INTERVAL '7 hours')
        AND d.trashbinid = 'TB_KANTIN_LT1'
    `;

    console.log('Checking raw volume data...');
    const rawResult = await pool.query(rawVolumeQuery, [startDate, endDate]);

    console.log('\n--- RAW VOLUME DATA ---');
    console.log(`Total volume records: ${rawResult.rows[0].total_volume_records}`);
    console.log(`Unique volume records: ${rawResult.rows[0].unique_volume_records}`);
    if (rawResult.rows[0].earliest_timestamp) {
      console.log(`Earliest timestamp: ${rawResult.rows[0].earliest_timestamp}`);
      console.log(`Latest timestamp: ${rawResult.rows[0].latest_timestamp}`);
    }

    // Check volume data grouped by 5-minute intervals
    const volumeIntervalQuery = `
      WITH intervals AS (
        SELECT
          DATE_TRUNC('hour', vd.timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta') +
          INTERVAL '5 minute' * FLOOR(EXTRACT(MINUTE FROM (vd.timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta')) / 5) as wib_interval,
          vd.timestamp,
          vd.volumedataid,
          vd.fill_percentage,
          d.deviceid,
          d.category
        FROM volumedata vd
        INNER JOIN sensor s ON vd.sensorid = s.sensorid
        INNER JOIN device d ON s.deviceid = d.deviceid
        WHERE vd.timestamp >= ($1::timestamp - INTERVAL '7 hours')
          AND vd.timestamp <= ($2::timestamp - INTERVAL '7 hours')
          AND d.trashbinid = 'TB_KANTIN_LT1'
      )
      SELECT
        wib_interval as time_interval,
        TO_CHAR(wib_interval, 'HH24:MI') as wib_time_display,
        deviceid,
        category,
        COUNT(DISTINCT volumedataid) as data_points,
        ROUND(AVG(fill_percentage)::numeric, 2) as avg_volume
      FROM intervals
      GROUP BY wib_interval, deviceid, category
      ORDER BY wib_interval, deviceid
    `;

    console.log('\nChecking 5-minute interval volume data...\n');
    const intervalResult = await pool.query(volumeIntervalQuery, [startDate, endDate]);

    console.log('--- VOLUME DATA BY 5-MINUTE INTERVALS ---');
    console.log(`Total rows returned: ${intervalResult.rows.length}`);

    if (intervalResult.rows.length > 0) {
      // Group by time
      const byTime = {};
      intervalResult.rows.forEach(row => {
        const time = row.wib_time_display;
        if (!byTime[time]) {
          byTime[time] = [];
        }
        byTime[time].push(row);
      });

      console.log(`Unique time intervals: ${Object.keys(byTime).length}\n`);

      console.log('Volume data points per interval:');
      console.log('-'.repeat(80));
      Object.keys(byTime).sort().forEach(time => {
        const devices = byTime[time].map(r =>
          `${r.category.slice(0,3)}:${r.avg_volume}% (${r.data_points}pts)`
        ).join(', ');
        console.log(`  ${time} - ${devices}`);
      });

      console.log('\n' + '='.repeat(80));
      console.log('SUMMARY:');
      console.log('='.repeat(80));
      const times = Object.keys(byTime).sort();
      console.log(`\nTime intervals present: ${times.join(', ')}`);

      const expected = ['00:00', '00:05', '00:10', '00:15', '00:20', '00:25', '00:30', '00:35', '00:40', '00:45', '00:50', '00:55'];
      const missing = expected.filter(t => !times.includes(t));

      if (missing.length > 0) {
        console.log(`\n⚠ Missing intervals: ${missing.join(', ')}`);
      } else {
        console.log('\n✓ All 12 intervals present!');
      }
    } else {
      console.log('\n⚠ NO VOLUME DATA FOUND for this time range!');
      console.log('This means volume data is either:');
      console.log('  1. Not being collected at all');
      console.log('  2. Stored at different timestamps than weight data');
      console.log('  3. Not available for TB_KANTIN_LT1');
    }

    // Compare with weight data
    console.log('\n' + '='.repeat(80));
    console.log('COMPARISON WITH WEIGHT DATA:');
    console.log('='.repeat(80));

    const weightQuery = `
      SELECT COUNT(DISTINCT wd.weightdataid) as weight_records
      FROM weightdata wd
      INNER JOIN sensor s ON wd.sensorid = s.sensorid
      INNER JOIN device d ON s.deviceid = d.deviceid
      WHERE wd.timestamp >= ($1::timestamp - INTERVAL '7 hours')
        AND wd.timestamp <= ($2::timestamp - INTERVAL '7 hours')
        AND d.trashbinid = 'TB_KANTIN_LT1'
    `;

    const weightResult = await pool.query(weightQuery, [startDate, endDate]);
    console.log(`\nWeight records in same time range: ${weightResult.rows[0].weight_records}`);
    console.log(`Volume records in same time range: ${rawResult.rows[0].unique_volume_records}`);

    const ratio = rawResult.rows[0].unique_volume_records > 0
      ? (weightResult.rows[0].weight_records / rawResult.rows[0].unique_volume_records).toFixed(2)
      : 'N/A';
    console.log(`Weight to Volume ratio: ${ratio}x`);

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

testVolumeData();
