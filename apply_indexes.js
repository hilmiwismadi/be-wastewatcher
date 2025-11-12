const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'wastewatcher_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function applyIndexes() {
  try {
    console.log('Reading SQL file...');
    const sql = fs.readFileSync('./add_indexes.sql', 'utf8');

    console.log('Applying indexes to database...\n');
    const result = await pool.query(sql);

    console.log('Indexes created successfully!\n');

    // Show the last result which contains the index list
    if (result[result.length - 1] && result[result.length - 1].rows) {
      console.log('Created indexes:');
      console.table(result[result.length - 1].rows);
    }

    await pool.end();
    console.log('\nDatabase connection closed.');
  } catch (error) {
    console.error('Error applying indexes:', error);
    await pool.end();
    process.exit(1);
  }
}

applyIndexes();
