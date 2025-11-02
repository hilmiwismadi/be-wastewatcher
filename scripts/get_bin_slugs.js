const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Generate slug from bin name
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '') // Remove all spaces
    .replace(/[^a-z0-9]/g, ''); // Remove special characters
}

async function getBinSlugs() {
  try {
    const result = await pool.query('SELECT trashbinid, name FROM trashbin ORDER BY name');

    console.log('Bin slug mapping:');
    console.log('export const binSlugToIdMapping: Record<string, string> = {');
    result.rows.forEach(r => {
      const slug = generateSlug(r.name);
      console.log(`  '${slug}': '${r.trashbinid}',`);
    });
    console.log('};');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
}

getBinSlugs();
