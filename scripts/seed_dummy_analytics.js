const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'wastewatcher_db',
  user: 'postgres',
  password: 'postgres'
});

// Function to generate random number within range
const randomInRange = (min, max) => Math.random() * (max - min) + min;

// Function to generate random integer within range
const randomIntInRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function seedDummyAnalytics() {
  try {
    console.log('🔄 Starting to seed dummy analytics data...\n');

    // Get all dummy device IDs (excluding the original Kantin devices)
    const devicesResult = await pool.query(`
      SELECT deviceid, category
      FROM device
      WHERE trashbinid != 'TB_KANTIN_LT1'
      ORDER BY deviceid
    `);

    const devices = devicesResult.rows;
    console.log(`📊 Found ${devices.length} dummy devices to populate analytics for\n`);

    // Generate analytics data for the last 30 days
    const days = 30;
    const today = new Date();

    let totalInserted = 0;

    for (const device of devices) {
      console.log(`   Processing ${device.deviceid} (${device.category})...`);

      for (let i = days - 1; i >= 0; i--) {
        const analysisDate = new Date(today);
        analysisDate.setDate(today.getDate() - i);
        analysisDate.setHours(0, 0, 0, 0);

        // Generate realistic random data based on category
        let baseWeight, baseVolume, baseDensity;

        if (device.category === 'Organic') {
          baseWeight = randomInRange(15, 40);
          baseVolume = randomInRange(40, 85);
          baseDensity = randomInRange(0.35, 0.50);
        } else if (device.category === 'Anorganic' || device.category === 'Inorganic') {
          baseWeight = randomInRange(10, 30);
          baseVolume = randomInRange(30, 75);
          baseDensity = randomInRange(0.25, 0.40);
        } else { // Residue/B3
          baseWeight = randomInRange(5, 20);
          baseVolume = randomInRange(20, 60);
          baseDensity = randomInRange(0.20, 0.35);
        }

        const avgWeight = Math.round(baseWeight * 100) / 100;
        const maxWeight = Math.round((baseWeight * randomInRange(1.2, 1.5)) * 100) / 100;
        const avgVolume = Math.round(baseVolume * 100) / 100;
        const maxVolume = Math.round((baseVolume * randomInRange(1.1, 1.3)) * 100) / 100;
        const collectionFrequency = randomIntInRange(0, 3);
        const wasteDensity = Math.round(baseDensity * 1000) / 1000;

        // Generate unique analyticsid (using timestamp + full device ID for uniqueness)
        const timestamp = analysisDate.getTime();
        const analyticsId = `DA_${timestamp}_${device.deviceid}`;

        const insertQuery = `
          INSERT INTO dailyanalytics (
            analyticsid,
            analysis_date,
            deviceid,
            avg_weight,
            max_weight,
            avg_volume,
            max_volume,
            collection_frequency,
            waste_density
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (analyticsid) DO NOTHING
        `;

        await pool.query(insertQuery, [
          analyticsId,
          analysisDate,
          device.deviceid,
          avgWeight,
          maxWeight,
          avgVolume,
          maxVolume,
          collectionFrequency,
          wasteDensity
        ]);

        totalInserted++;
      }

      console.log(`      ✅ Created ${days} daily analytics entries for ${device.deviceid}`);
    }

    console.log(`\n✅ Successfully seeded ${totalInserted} analytics entries for ${devices.length} devices!`);
    console.log(`📊 Each device has ${days} days of historical data\n`);

  } catch (error) {
    console.error('❌ Error seeding analytics:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

seedDummyAnalytics();
