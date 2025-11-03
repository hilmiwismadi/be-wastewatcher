const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'wastewatcher_db',
  user: 'postgres',
  password: 'postgres'
});

async function testQuery() {
  try {
    // Check if data exists for a specific device
    const result = await pool.query(`
      SELECT *
      FROM dailyanalytics
      WHERE deviceid = 'DEV-UTARA-LT1-ORG'
      ORDER BY analysis_date DESC
      LIMIT 5
    `);

    console.log('\n📊 Found', result.rows.length, 'records for DEV-UTARA-LT1-ORG:');
    result.rows.forEach(row => {
      console.log(`  ${row.analysis_date}: weight=${row.avg_weight}, volume=${row.avg_volume}`);
    });

    // Test the actual query used by the API
    const deviceId = 'DEV-UTARA-LT1-ORG';
    const category = 'Organic';
    const days = 30;

    let whereClause = `WHERE da.analysis_date >= CURRENT_DATE - INTERVAL '${days} days'`;
    whereClause += ` AND da.deviceid = '${deviceId}'`;
    whereClause += ` AND d.category = '${category}'`;

    const apiQuery = `
      SELECT
        da.analysis_date,
        COUNT(*) as device_count,
        ROUND(AVG(da.avg_weight)::numeric, 2) as avg_weight,
        ROUND(AVG(da.max_weight)::numeric, 2) as max_weight,
        ROUND(AVG(da.avg_volume)::numeric, 2) as avg_volume,
        ROUND(AVG(da.max_volume)::numeric, 2) as max_volume,
        ROUND(SUM(da.collection_frequency)::numeric, 0) as total_collections,
        ROUND(AVG(da.waste_density)::numeric, 3) as avg_density
      FROM dailyanalytics da
      JOIN device d ON da.deviceid = d.deviceid
      ${whereClause}
      GROUP BY da.analysis_date
      ORDER BY da.analysis_date
    `;

    console.log('\n🔍 Testing API query:');
    console.log(apiQuery);

    const apiResult = await pool.query(apiQuery);
    console.log('\n📊 API query returned', apiResult.rows.length, 'records');
    if (apiResult.rows.length > 0) {
      console.log('First 3 records:');
      apiResult.rows.slice(0, 3).forEach(row => {
        console.log(`  ${row.analysis_date}: weight=${row.avg_weight}, volume=${row.avg_volume}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

testQuery();
