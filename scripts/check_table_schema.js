const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'wastewatcher_db',
  user: 'postgres',
  password: 'postgres'
});

async function checkSchema() {
  try {
    // Get column information for dailyanalytics table
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'dailyanalytics'
      ORDER BY ordinal_position;
    `);

    console.log('\n📊 dailyanalytics table structure:');
    console.log('=====================================');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
    });
    console.log('=====================================\n');

    // Get a sample record
    const sampleResult = await pool.query(`
      SELECT * FROM dailyanalytics LIMIT 1
    `);

    if (sampleResult.rows.length > 0) {
      console.log('📝 Sample record:');
      console.log(JSON.stringify(sampleResult.rows[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkSchema();
