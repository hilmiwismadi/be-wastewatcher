const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres:TcRRtmZYRKQDLNyncAkIYPjmlDzgeWSj@ballast.proxy.rlwy.net:40244/railway';

async function fixTables() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('✅ Connected to Railway database\n');

    console.log('🗑️  Dropping existing tables...');
    await client.query(`
      DROP TABLE IF EXISTS "AlertLog" CASCADE;
      DROP TABLE IF EXISTS "BinStatus" CASCADE;
      DROP TABLE IF EXISTS "BinStatusHistory" CASCADE;
      DROP TABLE IF EXISTS "DailyAnalytics" CASCADE;
      DROP TABLE IF EXISTS "Device" CASCADE;
      DROP TABLE IF EXISTS "DeviceHealth" CASCADE;
      DROP TABLE IF EXISTS "Sensor" CASCADE;
      DROP TABLE IF EXISTS "SensorType" CASCADE;
      DROP TABLE IF EXISTS "TrashBin" CASCADE;
      DROP TABLE IF EXISTS "User" CASCADE;
      DROP TABLE IF EXISTS "UserSession" CASCADE;
      DROP TABLE IF EXISTS "VolumeData" CASCADE;
      DROP TABLE IF EXISTS "WasteCategory" CASCADE;
      DROP TABLE IF EXISTS "WeightData" CASCADE;
      DROP TABLE IF EXISTS "_prisma_migrations" CASCADE;
    `);
    console.log('✅ Dropped all tables\n');

    console.log('📝 Database is clean. Now run: npx prisma migrate deploy');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

fixTables();
