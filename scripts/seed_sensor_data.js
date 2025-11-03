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
  FULL: { status: 'full', minFill: 81, maxFill: 100 },           // Penuh
  HIGH: { status: 'high', minFill: 61, maxFill: 80 },            // Hampir Penuh
  MEDIUM: { status: 'medium', minFill: 31, maxFill: 60 },        // Menengah
  LOW: { status: 'low', minFill: 11, maxFill: 30 },              // Rendah
  EMPTY: { status: 'empty', minFill: 0, maxFill: 10 }            // Kosong
};

async function seedSensorData() {
  try {
    console.log('🔄 Starting to seed sensor data for all bins...\n');

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

    // Assign bins to status categories for balanced distribution
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

    let totalInserts = 0;

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
        // Get or create sensors for this device
        const sensorsResult = await pool.query(`
          SELECT sensorid, sensor_type
          FROM sensor
          WHERE deviceid = $1
        `, [device.deviceid]);

        let sensors = sensorsResult.rows;

        // If no sensors exist, create them
        if (sensors.length === 0) {
          const weightSensorId = `SEN-${device.deviceid}-WEIGHT`;
          const volumeSensorId = `SEN-${device.deviceid}-VOLUME`;

          await pool.query(`
            INSERT INTO sensor (sensorid, deviceid, sensor_type, sensor_position, status)
            VALUES
              ($1, $2, 'load_cell', 'center', 'active'),
              ($3, $2, 'ultrasonic', 'top', 'active')
            ON CONFLICT (sensorid) DO NOTHING
          `, [weightSensorId, device.deviceid, volumeSensorId]);

          sensors = [
            { sensorid: weightSensorId, sensor_type: 'load_cell' },
            { sensorid: volumeSensorId, sensor_type: 'ultrasonic' }
          ];
        }

        const weightSensor = sensors.find(s => s.sensor_type === 'load_cell');
        const volumeSensor = sensors.find(s => s.sensor_type === 'ultrasonic');

        // Determine target fill percentage for this device
        const targetFillPercentage = randomInRange(statusConfig.minFill, statusConfig.maxFill);

        // Generate hourly data for the past 30 days
        const days = 30;
        const hoursPerDay = 24;
        const now = new Date();

        let currentWeight = 0;
        let currentFillPercentage = randomInRange(5, 15); // Start low

        for (let day = days - 1; day >= 0; day--) {
          for (let hour = 0; hour < hoursPerDay; hour++) {
            const timestamp = new Date(now);
            timestamp.setDate(now.getDate() - day);
            timestamp.setHours(hour, randomIntInRange(0, 59), randomIntInRange(0, 59), 0);

            // Gradually increase to target fill percentage (simulating accumulation)
            const progressRatio = 1 - (day * hoursPerDay + (hoursPerDay - hour)) / (days * hoursPerDay);
            const targetWeight = device.category === 'Organic' ? randomInRange(20, 45) :
                                 device.category === 'Anorganic' ? randomInRange(15, 35) :
                                 randomInRange(8, 25);

            currentWeight = targetWeight * progressRatio + randomInRange(-2, 2);
            currentWeight = Math.max(0, currentWeight);

            currentFillPercentage = targetFillPercentage * progressRatio + randomInRange(-5, 5);
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
              totalInserts++;
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
              totalInserts++;
            }
          }
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

    console.log(`\n✅ Successfully seeded ${totalInserts} sensor data records!`);
    console.log(`📊 Each bin now has 30 days of hourly data\n`);

  } catch (error) {
    console.error('❌ Error seeding sensor data:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

seedSensorData();
