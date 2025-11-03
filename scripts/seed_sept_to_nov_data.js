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

// Bin status categories for balanced distribution
const BIN_STATUSES = {
  FULL: { status: 'full', minFill: 81, maxFill: 100 },
  HIGH: { status: 'high', minFill: 61, maxFill: 80 },
  MEDIUM: { status: 'medium', minFill: 31, maxFill: 60 },
  LOW: { status: 'low', minFill: 11, maxFill: 30 },
  EMPTY: { status: 'empty', minFill: 0, maxFill: 10 }
};

async function seedSeptToNovData() {
  try {
    console.log('🔄 Starting to seed data from September to November...\n');

    // Get all bins (excluding Kantin LT 1 which already has data)
    const binsResult = await pool.query(`
      SELECT trashbinid, name
      FROM trashbin
      WHERE trashbinid != 'TB_KANTIN_LT1'
      ORDER BY trashbinid
    `);

    const bins = binsResult.rows;
    console.log(`📊 Found ${bins.length} bins to populate\n`);

    // Distribute bins evenly across status categories
    const statusKeys = Object.keys(BIN_STATUSES);
    const binsPerStatus = Math.ceil(bins.length / statusKeys.length);

    let binIndex = 0;
    const binStatusAssignments = [];

    for (const statusKey of statusKeys) {
      const statusConfig = BIN_STATUSES[statusKey];
      const binsForThisStatus = bins.slice(binIndex, binIndex + binsPerStatus);

      for (const bin of binsForThisStatus) {
        binStatusAssignments.push({
          trashbinid: bin.trashbinid,
          name: bin.name,
          statusConfig
        });
      }

      binIndex += binsPerStatus;
    }

    console.log('📋 Bin status distribution:');
    const statusCounts = {};
    for (const statusKey of statusKeys) {
      statusCounts[statusKey] = binStatusAssignments.filter(
        b => b.statusConfig.status === BIN_STATUSES[statusKey].status
      ).length;
      console.log(`   ${BIN_STATUSES[statusKey].status}: ${statusCounts[statusKey]} bins`);
    }
    console.log('');

    // Date range: September 1 to November 2, 2025
    const startDate = new Date('2025-09-01T00:00:00');
    const endDate = new Date('2025-11-02T23:59:59');
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    console.log(`📅 Generating data from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()} (${totalDays} days)\n`);

    let totalSensorInserts = 0;
    let totalAnalyticsInserts = 0;

    // Process each bin
    for (const binAssignment of binStatusAssignments) {
      const { trashbinid, name, statusConfig } = binAssignment;

      console.log(`📦 Processing ${name} (${trashbinid}) - Target: ${statusConfig.status}...`);

      // Get devices for this bin
      const devicesResult = await pool.query(`
        SELECT deviceid, category
        FROM device
        WHERE trashbinid = $1
        ORDER BY category
      `, [trashbinid]);

      const devices = devicesResult.rows;

      if (devices.length === 0) {
        console.log(`   ⚠️  No devices found for ${name}`);
        continue;
      }

      // Generate data for each device
      for (const device of devices) {
        // Create sensors for this device
        const weightSensorId = `SEN-${device.deviceid}-WEIGHT`;
        const volumeSensorId = `SEN-${device.deviceid}-VOLUME`;

        await pool.query(`
          INSERT INTO sensor (sensorid, deviceid, sensor_type, sensor_position, status)
          VALUES
            ($1, $2, 'load_cell', 'center', 'active'),
            ($3, $2, 'ultrasonic', 'top', 'active')
          ON CONFLICT (sensorid) DO NOTHING
        `, [weightSensorId, device.deviceid, volumeSensorId]);

        const sensors = [
          { sensorid: weightSensorId, sensor_type: 'load_cell' },
          { sensorid: volumeSensorId, sensor_type: 'ultrasonic' }
        ];

        const weightSensor = sensors.find(s => s.sensor_type === 'load_cell');
        const volumeSensor = sensors.find(s => s.sensor_type === 'ultrasonic');

        // Determine target fill percentage for this device
        const targetFillPercentage = randomInRange(statusConfig.minFill, statusConfig.maxFill);

        // Base weights by category
        const baseWeightRange = device.category === 'Organic' ? { min: 20, max: 45 } :
                                device.category === 'Anorganic' ? { min: 15, max: 35 } :
                                { min: 8, max: 25 };

        let currentWeight = randomInRange(5, 10); // Start low
        let currentFillPercentage = randomInRange(5, 15);

        // Generate hourly data for the entire period
        const hoursPerDay = 24;
        const totalHours = totalDays * hoursPerDay;

        for (let hourIndex = 0; hourIndex < totalHours; hourIndex++) {
          const timestamp = new Date(startDate);
          timestamp.setHours(startDate.getHours() + hourIndex);

          // Progress ratio (0 to 1 over the entire period)
          const progressRatio = hourIndex / totalHours;

          // Add weekly cycles (waste accumulates during week, drops on weekends for collection)
          const dayOfWeek = timestamp.getDay();
          const weekProgress = (hourIndex % (7 * 24)) / (7 * 24);

          // Collection happens on weekends (Saturday/Sunday)
          let collectionFactor = 1;
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            collectionFactor = 0.3; // Reduce to 30% after collection
          }

          // Calculate target weight for this point in time
          const targetWeight = randomInRange(baseWeightRange.min, baseWeightRange.max);
          const weeklyWeight = targetWeight * weekProgress * collectionFactor;
          currentWeight = (weeklyWeight + progressRatio * targetWeight * 0.5) + randomInRange(-2, 2);
          currentWeight = Math.max(0, currentWeight);

          // Calculate fill percentage with similar pattern
          const weeklyFill = targetFillPercentage * weekProgress * collectionFactor;
          currentFillPercentage = (weeklyFill + progressRatio * targetFillPercentage * 0.5) + randomInRange(-5, 5);
          currentFillPercentage = Math.max(0, Math.min(100, currentFillPercentage));

          // Insert weight data
          if (weightSensor) {
            const weightId = `WD_${timestamp.getTime()}_${weightSensor.sensorid}`;
            await pool.query(`
              INSERT INTO weightdata (weightdataid, sensorid, weight_kg, raw_reading, timestamp)
              VALUES ($1, $2, $3, $4, $5)
              ON CONFLICT (weightdataid) DO NOTHING
            `, [
              weightId,
              weightSensor.sensorid,
              Math.round(currentWeight * 100) / 100,
              Math.round(currentWeight * 1000),
              timestamp
            ]);
            totalSensorInserts++;
          }

          // Insert volume data
          if (volumeSensor) {
            const volumeId = `VD_${timestamp.getTime()}_${volumeSensor.sensorid}`;
            const binHeight = 100; // cm
            const distanceCm = binHeight * (1 - currentFillPercentage / 100);

            await pool.query(`
              INSERT INTO volumedata (volumedataid, sensorid, distance_cm, fill_percentage, raw_reading, timestamp)
              VALUES ($1, $2, $3, $4, $5, $6)
              ON CONFLICT (volumedataid) DO NOTHING
            `, [
              volumeId,
              volumeSensor.sensorid,
              Math.round(distanceCm * 10) / 10,
              Math.round(currentFillPercentage * 10) / 10,
              Math.round(distanceCm * 10),
              timestamp
            ]);
            totalSensorInserts++;
          }
        }

        // Generate daily analytics
        for (let day = 0; day < totalDays; day++) {
          const analysisDate = new Date(startDate);
          analysisDate.setDate(startDate.getDate() + day);
          analysisDate.setHours(0, 0, 0, 0);

          const progressRatio = day / totalDays;
          const targetWeight = randomInRange(baseWeightRange.min, baseWeightRange.max);

          const avgWeight = Math.round((targetWeight * progressRatio + randomInRange(5, 15)) * 100) / 100;
          const maxWeight = Math.round((avgWeight * randomInRange(1.2, 1.5)) * 100) / 100;
          const avgVolume = Math.round((targetFillPercentage * progressRatio + randomInRange(10, 20)) * 100) / 100;
          const maxVolume = Math.round((avgVolume * randomInRange(1.1, 1.3)) * 100) / 100;
          const collectionFrequency = randomIntInRange(0, 3);
          const wasteDensity = Math.round(randomInRange(0.2, 0.5) * 1000) / 1000;

          const analyticsId = `DA_${analysisDate.getTime()}_${device.deviceid}`;

          await pool.query(`
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
          `, [
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
          totalAnalyticsInserts++;
        }

        // Update binstatus with final values
        const finalWeight = Math.round(currentWeight * 10) / 10;
        const finalFillPercentage = Math.round(currentFillPercentage * 10) / 10;

        await pool.query(`
          UPDATE binstatus
          SET
            total_weight_kg = $1,
            average_volume_percentage = $2,
            status = $3,
            last_updated = NOW()
          WHERE deviceid = $4
        `, [finalWeight, finalFillPercentage, statusConfig.status, device.deviceid]);

        console.log(`      ✅ ${device.category}: ${finalWeight}kg, ${finalFillPercentage}% (${statusConfig.status})`);
      }
    }

    console.log(`\n✅ Successfully seeded data!`);
    console.log(`   📊 Sensor data records: ${totalSensorInserts}`);
    console.log(`   📈 Analytics records: ${totalAnalyticsInserts}`);
    console.log(`   📅 Date range: September 1 - November 2, 2025 (${totalDays} days)\n`);

  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

seedSeptToNovData();
