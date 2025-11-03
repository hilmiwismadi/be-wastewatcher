const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'wastewatcher_db',
  user: 'postgres',
  password: 'postgres'
});

async function checkData() {
  try {
    // Count total analytics records
    const total = await pool.query(`
      SELECT COUNT(*) as count FROM dailyanalytics
    `);
    console.log('\n📊 Total dailyanalytics records:', total.rows[0].count);

    // Count by device
    const byDevice = await pool.query(`
      SELECT deviceid, COUNT(*) as count
      FROM dailyanalytics
      WHERE deviceid LIKE 'DEV-%'
      GROUP BY deviceid
      ORDER BY deviceid
      LIMIT 10
    `);
    console.log('\n📊 Records per device (first 10):');
    byDevice.rows.forEach(row => {
      console.log(`  ${row.deviceid}: ${row.count} records`);
    });

    // Check what analytics IDs look like
    const sampleIds = await pool.query(`
      SELECT analyticsid, deviceid, analysis_date
      FROM dailyanalytics
      WHERE deviceid LIKE 'DEV-UTARA%'
      LIMIT 5
    `);
    console.log('\n📋 Sample analytics IDs for UTARA devices:');
    sampleIds.rows.forEach(row => {
      console.log(`  ${row.analyticsid} | ${row.deviceid} | ${row.analysis_date}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkData();
