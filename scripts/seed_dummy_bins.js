const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    const sqlPath = path.join(__dirname, '..', 'prisma', 'seed_dummy_bins.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL statements by semicolon and filter out comments and empty lines
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await pool.query(statement);
          console.log(`✓ Statement ${i + 1}/${statements.length} executed`);
        } catch (error) {
          console.error(`✗ Error in statement ${i + 1}:`, error.message);
          // Continue with next statement
        }
      }
    }

    console.log('\n✓ Database seeding completed!');

    // Verify the data
    const result = await pool.query('SELECT COUNT(*) FROM trashbin WHERE name LIKE \'%LT%\'');
    console.log(`Total dummy bins created: ${result.rows[0].count}`);

    const deviceResult = await pool.query('SELECT COUNT(*) FROM device WHERE deviceid LIKE \'DEV-%LT%\'');
    console.log(`Total dummy devices created: ${deviceResult.rows[0].count}`);

    const statusResult = await pool.query('SELECT COUNT(*) FROM binstatus WHERE binstatusid LIKE \'BS-%LT%\'');
    console.log(`Total dummy bin status entries created: ${statusResult.rows[0].count}`);

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedDatabase();
