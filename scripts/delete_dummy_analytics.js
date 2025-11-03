const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'wastewatcher_db',
  user: 'postgres',
  password: 'postgres'
});

async function deleteData() {
  try {
    console.log('🗑️  Deleting dummy analytics data...');

    const result = await pool.query(`
      DELETE FROM dailyanalytics
      WHERE deviceid LIKE 'DEV-%'
      AND deviceid NOT LIKE 'DEV_KANTIN_%'
    `);

    console.log(`✅ Deleted ${result.rowCount} analytics records`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

deleteData();
