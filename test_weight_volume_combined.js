const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'wastewatcher_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function testCombinedQuery() {
  try {
    console.log('='.repeat(80));
    console.log('TESTING COMBINED WEIGHT + VOLUME QUERY');
    console.log('='.repeat(80));

    const startDate = '2025-11-02 00:00:00';
    const endDate = '2025-11-02 00:59:59';

    console.log(`\nTime range (WIB): ${startDate} to ${endDate}\n`);

    const whereClause = `WHERE wd.timestamp >= ($1::timestamp - INTERVAL '7 hours')
                         AND wd.timestamp <= ($2::timestamp - INTERVAL '7 hours')
                         AND d.trashbinid = 'TB_KANTIN_LT1'`;

    const query = `
      WITH weight_intervals AS (
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
        ${whereClause}
      ),
      volume_intervals AS (
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
        ${whereClause.replace(/wd\./g, 'vd.')}
      ),
      weight_agg AS (
        SELECT
          wib_interval,
          deviceid,
          category,
          COUNT(DISTINCT weightdataid) as weight_data_points,
          ROUND(AVG(weight_kg)::numeric, 2) as avg_weight
        FROM weight_intervals
        GROUP BY wib_interval, deviceid, category
      ),
      volume_agg AS (
        SELECT
          wib_interval,
          deviceid,
          category,
          COUNT(DISTINCT volumedataid) as volume_data_points,
          ROUND(AVG(fill_percentage)::numeric, 2) as avg_volume
        FROM volume_intervals
        GROUP BY wib_interval, deviceid, category
      )
      SELECT
        COALESCE(w.wib_interval, v.wib_interval) as time_interval,
        TO_CHAR(COALESCE(w.wib_interval, v.wib_interval), 'HH24:MI') as wib_time_display,
        COALESCE(w.deviceid, v.deviceid) as deviceid,
        COALESCE(w.category, v.category) as category,
        COALESCE(w.weight_data_points, 0) as data_points,
        COALESCE(w.avg_weight, 0) as avg_weight,
        COALESCE(v.avg_volume, 0) as avg_volume
      FROM weight_agg w
      FULL OUTER JOIN volume_agg v
        ON w.wib_interval = v.wib_interval
        AND w.deviceid = v.deviceid
      ORDER BY time_interval, deviceid
      LIMIT 200
    `;

    const result = await pool.query(query, [startDate, endDate]);

    console.log(`Total rows: ${result.rows.length}\n`);

    // Group by time interval
    const byTime = {};
    result.rows.forEach(row => {
      const time = row.wib_time_display;
      if (!byTime[time]) {
        byTime[time] = [];
      }
      byTime[time].push(row);
    });

    console.log('='.repeat(80));
    console.log('WEIGHT + VOLUME DATA BY INTERVAL:');
    console.log('='.repeat(80));

    Object.keys(byTime).sort().forEach(time => {
      console.log(`\n${time}:`);
      byTime[time].forEach(row => {
        console.log(`  ${row.category.padEnd(10)} - Weight: ${row.avg_weight.toString().padEnd(6)}kg | Volume: ${row.avg_volume.toString().padEnd(6)}%`);
      });
    });

    // Verify both weight and volume have data
    console.log('\n' + '='.repeat(80));
    console.log('VERIFICATION:');
    console.log('='.repeat(80));

    const hasWeight = result.rows.some(r => parseFloat(r.avg_weight) > 0);
    const hasVolume = result.rows.some(r => parseFloat(r.avg_volume) > 0);

    console.log(`\n✓ Unique intervals: ${Object.keys(byTime).length}`);
    console.log(`✓ Has weight data: ${hasWeight ? 'YES' : 'NO'}`);
    console.log(`✓ Has volume data: ${hasVolume ? 'YES' : 'NO'}`);

    if (hasWeight && hasVolume) {
      console.log('\n✓✓ SUCCESS! Both weight and volume data present!');
    } else {
      console.log('\n✗ PROBLEM: Missing weight or volume data!');
    }

    // Sample aggregation (what frontend does)
    console.log('\n' + '='.repeat(80));
    console.log('FRONTEND AGGREGATION SAMPLE (First 3 intervals):');
    console.log('='.repeat(80));

    Object.keys(byTime).sort().slice(0, 3).forEach(time => {
      const totalWeight = byTime[time].reduce((sum, r) => sum + parseFloat(r.avg_weight), 0);
      const avgVolume = byTime[time].reduce((sum, r) => sum + parseFloat(r.avg_volume), 0) / byTime[time].length;

      console.log(`\n${time}:`);
      console.log(`  Total Weight: ${totalWeight.toFixed(2)} kg`);
      console.log(`  Average Volume: ${avgVolume.toFixed(2)} %`);
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

testCombinedQuery();
