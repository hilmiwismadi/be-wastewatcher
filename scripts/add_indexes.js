/**
 * Add Database Indexes for Performance Optimization
 * This script adds indexes to speed up analytics queries
 *
 * Run with: node scripts/add_indexes.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addIndexes() {
  console.log('🚀 Starting to add database indexes for performance optimization...\n');

  const indexes = [
    {
      name: 'idx_weightdata_timestamp',
      table: 'weightdata',
      column: 'timestamp',
      description: 'Index on weightdata timestamp for time-based queries'
    },
    {
      name: 'idx_weightdata_sensorid',
      table: 'weightdata',
      column: 'sensorid',
      description: 'Index on weightdata sensorid for joins'
    },
    {
      name: 'idx_volumedata_timestamp',
      table: 'volumedata',
      column: 'timestamp',
      description: 'Index on volumedata timestamp for time-based queries'
    },
    {
      name: 'idx_volumedata_sensorid',
      table: 'volumedata',
      column: 'sensorid',
      description: 'Index on volumedata sensorid for joins'
    },
    {
      name: 'idx_sensor_deviceid',
      table: 'sensor',
      column: 'deviceid',
      description: 'Index on sensor deviceid for joins'
    },
    {
      name: 'idx_device_trashbinid',
      table: 'device',
      column: 'trashbinid',
      description: 'Index on device trashbinid for filtering by bin'
    },
    {
      name: 'idx_dailyanalytics_date',
      table: 'dailyanalytics',
      column: 'analysis_date',
      description: 'Index on dailyanalytics date'
    },
    {
      name: 'idx_dailyanalytics_deviceid',
      table: 'dailyanalytics',
      column: 'deviceid',
      description: 'Index on dailyanalytics deviceid'
    }
  ];

  const compositeIndexes = [
    {
      name: 'idx_weightdata_timestamp_sensorid',
      table: 'weightdata',
      columns: '(timestamp, sensorid)',
      description: 'Composite index for weightdata queries'
    },
    {
      name: 'idx_volumedata_timestamp_sensorid',
      table: 'volumedata',
      columns: '(timestamp, sensorid)',
      description: 'Composite index for volumedata queries'
    }
  ];

  try {
    // Add single-column indexes
    for (const index of indexes) {
      console.log(`📋 ${index.description}`);
      const query = `CREATE INDEX IF NOT EXISTS ${index.name} ON ${index.table}(${index.column})`;
      await pool.query(query);
      console.log(`   ✅ Created index: ${index.name}`);
    }

    console.log('\n');

    // Add composite indexes
    for (const index of compositeIndexes) {
      console.log(`📋 ${index.description}`);
      const query = `CREATE INDEX IF NOT EXISTS ${index.name} ON ${index.table}${index.columns}`;
      await pool.query(query);
      console.log(`   ✅ Created index: ${index.name}`);
    }

    console.log('\n🔄 Analyzing tables to update statistics...');

    // Analyze tables
    await pool.query('ANALYZE weightdata');
    console.log('   ✅ Analyzed weightdata');

    await pool.query('ANALYZE volumedata');
    console.log('   ✅ Analyzed volumedata');

    await pool.query('ANALYZE sensor');
    console.log('   ✅ Analyzed sensor');

    await pool.query('ANALYZE device');
    console.log('   ✅ Analyzed device');

    await pool.query('ANALYZE dailyanalytics');
    console.log('   ✅ Analyzed dailyanalytics');

    // Show created indexes
    console.log('\n📊 Listing all indexes...');
    const result = await pool.query(`
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename IN ('weightdata', 'volumedata', 'sensor', 'device', 'dailyanalytics')
      ORDER BY tablename, indexname
    `);

    console.log('\nIndexes by table:');
    let currentTable = '';
    for (const row of result.rows) {
      if (row.tablename !== currentTable) {
        currentTable = row.tablename;
        console.log(`\n📦 ${currentTable}:`);
      }
      console.log(`   - ${row.indexname}`);
    }

    console.log('\n✅ All indexes created successfully!');
    console.log('🚀 Query performance should be significantly improved now.\n');

  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

addIndexes()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
