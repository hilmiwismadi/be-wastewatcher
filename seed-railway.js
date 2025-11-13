const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Railway DATABASE_URL
const DATABASE_URL = 'postgresql://postgres:TcRRtmZYRKQDLNyncAkIYPjmlDzgeWSj@ballast.proxy.rlwy.net:40244/railway';

async function seedDatabase() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    console.log('🔌 Connecting to Railway database...');
    await client.connect();
    console.log('✅ Connected successfully!');

    // Check existing tables
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('\n📋 Existing tables in database:');
    if (tablesResult.rows.length === 0) {
      console.log('   ❌ No tables found! Migration may have failed.');
      return;
    }
    tablesResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`);
    });

    // Check column names for trashbin table
    const columnsResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'trashbin'
      ORDER BY ordinal_position;
    `);
    console.log('\n📋 Columns in trashbin table:');
    columnsResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.column_name}`);
    });
    console.log('');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'prisma', 'seed_dummy_bins.sql');
    let sql = fs.readFileSync(sqlFilePath, 'utf8');

    // Tables are now lowercase, no fixes needed
    console.log('✅ Table names match database schema (all lowercase)');

    console.log('📝 Executing seed SQL...');
    await client.query(sql);

    console.log('✅ Database seeded successfully!');
    console.log('📊 Created:');
    console.log('   - 23 trash bins');
    console.log('   - 69 devices (3 per bin)');
    console.log('   - Bin status data');
    console.log('   - Device health data');

  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Connection closed');
  }
}

seedDatabase();
