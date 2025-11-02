const { prisma } = require('./src/config/prisma');

async function checkTables() {
  try {
    const tables = await prisma.$queryRaw`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;

    console.log('\n=== Tables in wastewatcher_db ===');
    console.log(`Found ${tables.length} tables:\n`);

    tables.forEach(t => {
      console.log(`  ✓ ${t.tablename}`);
    });

    // Expected tables
    const expectedTables = [
      'TrashBin', 'Device', 'Sensor',
      'WeightData', 'VolumeData',
      'BinStatus', 'BinStatusHistory', 'DeviceHealth',
      'DailyAnalytics', 'AlertLog',
      'User', 'UserSession',
      'SensorType', 'WasteCategory'
    ];

    console.log('\n=== Expected vs Actual ===');
    const actualTableNames = tables.map(t => t.tablename);

    expectedTables.forEach(table => {
      const exists = actualTableNames.includes(table);
      console.log(`  ${exists ? '✓' : '✗'} ${table}`);
    });

    const missing = expectedTables.filter(t => !actualTableNames.includes(t));
    if (missing.length > 0) {
      console.log('\n❌ Missing tables:', missing.join(', '));
      console.log('\n💡 You need to run the SQL setup scripts:');
      console.log('   1. Open pgAdmin');
      console.log('   2. Run: sql_setup/02_database_setup.sql');
    } else {
      console.log('\n✅ All expected tables exist!');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();
