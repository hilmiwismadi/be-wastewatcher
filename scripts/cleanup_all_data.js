const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'wastewatcher_db',
  user: 'postgres',
  password: 'postgres'
});

async function cleanupAllData() {
  try {
    console.log('🗑️  Starting cleanup of all sensor and analytics data...\n');

    // Delete weightdata
    const weightResult = await pool.query(`
      DELETE FROM weightdata
      WHERE sensorid IN (
        SELECT sensorid FROM sensor
        WHERE deviceid IN (
          SELECT deviceid FROM device
          WHERE trashbinid != 'TB_KANTIN_LT1'
        )
      )
    `);
    console.log(`   ✅ Deleted ${weightResult.rowCount} weight data records`);

    // Delete volumedata
    const volumeResult = await pool.query(`
      DELETE FROM volumedata
      WHERE sensorid IN (
        SELECT sensorid FROM sensor
        WHERE deviceid IN (
          SELECT deviceid FROM device
          WHERE trashbinid != 'TB_KANTIN_LT1'
        )
      )
    `);
    console.log(`   ✅ Deleted ${volumeResult.rowCount} volume data records`);

    // Delete dailyanalytics
    const analyticsResult = await pool.query(`
      DELETE FROM dailyanalytics
      WHERE deviceid IN (
        SELECT deviceid FROM device
        WHERE trashbinid != 'TB_KANTIN_LT1'
      )
    `);
    console.log(`   ✅ Deleted ${analyticsResult.rowCount} daily analytics records`);

    // Delete sensors
    const sensorsResult = await pool.query(`
      DELETE FROM sensor
      WHERE deviceid IN (
        SELECT deviceid FROM device
        WHERE trashbinid != 'TB_KANTIN_LT1'
      )
    `);
    console.log(`   ✅ Deleted ${sensorsResult.rowCount} sensor records`);

    console.log('\n✅ Cleanup completed successfully!\n');

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

cleanupAllData();
