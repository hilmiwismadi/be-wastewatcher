const { Client } = require('pg');
const fs = require('fs');

const RAILWAY_DATABASE_URL = 'postgresql://postgres:TcRRtmZYRKQDLNyncAkIYPjmlDzgeWSj@ballast.proxy.rlwy.net:40244/railway';

async function importData() {
  const client = new Client({ connectionString: RAILWAY_DATABASE_URL });

  try {
    await client.connect();
    console.log('✅ Connected to RAILWAY database\n');

    // Read SQL file
    const filename = 'railway-import.sql';
    if (!fs.existsSync(filename)) {
      console.error(`❌ File not found: ${filename}`);
      console.log('Please run: node export-local-data.js first');
      return;
    }

    const sql = fs.readFileSync(filename, 'utf8');
    console.log('📝 Executing import...');
    console.log(`📊 SQL file size: ${(fs.statSync(filename).size / 1024).toFixed(2)} KB\n`);

    // Execute SQL
    await client.query(sql);

    console.log('✅ Import complete!');
    console.log('\n🎉 All data has been imported to Railway database');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await client.end();
  }
}

importData();
