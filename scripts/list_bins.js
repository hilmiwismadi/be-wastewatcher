const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function listBins() {
  try {
    const bins = await pool.query('SELECT name, floor FROM trashbin ORDER BY floor, name');
    console.log('All 24 trash bins:');
    bins.rows.forEach((r, i) => console.log(`  ${i+1}. ${r.name} (${r.floor})`));

    const status = await pool.query('SELECT status, COUNT(*) as count FROM binstatus GROUP BY status ORDER BY status');
    console.log('\nStatus distribution:');
    status.rows.forEach(r => console.log(`  ${r.status}: ${r.count}`));

  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

listBins();
