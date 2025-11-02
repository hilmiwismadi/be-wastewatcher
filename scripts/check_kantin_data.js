const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function checkKantinData() {
  try {
    console.log('Checking Kantin LT 1 data in database...\n');

    // Check what trashbinid Kantin LT 1 has
    const binQuery = await pool.query("SELECT trashbinid, name FROM trashbin WHERE name LIKE '%Kantin%'");
    console.log('Kantin bins found:');
    binQuery.rows.forEach(r => console.log(`  ${r.name}: ${r.trashbinid}`));

    if (binQuery.rows.length > 0) {
      const kantinId = binQuery.rows[0].trashbinid;
      console.log(`\nChecking devices for ${kantinId}...\n`);

      const deviceQuery = await pool.query(
        `SELECT d.deviceid, d.category, bs.average_volume_percentage, bs.total_weight_kg
         FROM device d
         LEFT JOIN binstatus bs ON d.deviceid = bs.deviceid
         WHERE d.trashbinid = $1
         ORDER BY d.category`,
        [kantinId]
      );

      console.log('Device data:');
      deviceQuery.rows.forEach(r => {
        console.log(`  ${r.category}: ${r.average_volume_percentage}% (${r.total_weight_kg} kg)`);
      });
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
}

checkKantinData();
