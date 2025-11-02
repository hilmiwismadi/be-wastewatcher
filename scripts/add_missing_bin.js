const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function addMissingBin() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('Adding Selatan LT 3...');

    // Add trash bin
    await client.query(
      `INSERT INTO trashbin (trashbinid, name, location, area, floor, capacity_liters, installation_date, status)
       VALUES ('TB-SELATAN-LT3', 'Selatan LT 3', 'South Wing Level 3', 'Academic Building', 'Lantai 3', 240, '2024-01-15', 'active')`
    );

    const categories = ['Organic', 'Anorganic', 'Residue'];

    for (const cat of categories) {
      const deviceId = `DEV-SELATAN-LT3-${cat.substring(0, 3).toUpperCase()}`;

      // Add device
      await client.query(
        `INSERT INTO device (deviceid, trashbinid, category, installation_date, status)
         VALUES ($1, 'TB-SELATAN-LT3', $2, '2024-01-15', 'active')`,
        [deviceId, cat]
      );

      // Generate random data
      const pct = Math.round((Math.random() * 80 + 15) * 10) / 10;
      const weight = Math.round((pct / 100 * 5) * 10) / 10;
      const status = pct >= 75 ? 'full' : pct >= 50 ? 'high' : pct >= 25 ? 'medium' : 'low';

      // Add bin status
      await client.query(
        `INSERT INTO binstatus (binstatusid, deviceid, total_weight_kg, average_volume_percentage, status, condition)
         VALUES ($1, $2, $3, $4, $5, 'even')`,
        [`BS-S3${cat.substring(0, 1)}`, deviceId, weight, pct, status]
      );

      // Add device health
      const battery = Math.floor(Math.random() * 31) + 65;
      await client.query(
        `INSERT INTO devicehealth (healthid, deviceid, battery_percentage, error_count_24h)
         VALUES ($1, $2, $3, 0)`,
        [`DH-S3${cat.substring(0, 1)}`, deviceId, battery]
      );
    }

    await client.query('COMMIT');
    console.log('✓ Successfully added Selatan LT 3 with 3 devices');

    // Verify total
    const result = await client.query('SELECT COUNT(*) FROM trashbin');
    console.log(`Total bins in database: ${result.rows[0].count}`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

addMissingBin();
