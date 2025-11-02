/**
 * Seed Script for Kantin LT 1 - ALL 3 CATEGORIES
 * Creates minute-by-minute data for 2 months with realistic waste accumulation
 *
 * Pattern:
 * - Weight and volume increase gradually every minute
 * - Collection event every 1-3 days (randomly) - resets to near 0
 * - Realistic daily patterns (more waste during meal times)
 * - Creates 3 devices: Organic, Anorganic, Residue
 *
 * To run: node scripts/seedKantinLT1.js
 */

const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

// Configuration
const SPAN_MONTHS = 2;
const END_DATE = new Date();
const START_DATE = new Date();
START_DATE.setMonth(START_DATE.getMonth() - SPAN_MONTHS);
START_DATE.setHours(0, 0, 0, 0);
const COLLECTION_INTERVAL_DAYS_MIN = 1;
const COLLECTION_INTERVAL_DAYS_MAX = 3;

// Bin capacity
const BIN_CAPACITY_LITERS = 120;
const BIN_HEIGHT_CM = 120;

// Waste categories configuration
const CATEGORIES = {
  Organic: {
    deviceId: 'DEV_KANTIN_LT1_ORGANIC',
    maxWeight: 60, // Organic is heavier (food waste)
    baseIncrease: 0.020, // kg per minute
    sensors: {
      ultrasonic1: 'SENS_KLT1_ORG_U1',
      ultrasonic2: 'SENS_KLT1_ORG_U2',
      ultrasonic3: 'SENS_KLT1_ORG_U3',
      ultrasonic4: 'SENS_KLT1_ORG_U4',
      loadcell: 'SENS_KLT1_ORG_LC'
    }
  },
  Anorganic: {
    deviceId: 'DEV_KANTIN_LT1_ANORGANIC',
    maxWeight: 45, // Anorganic is lighter (plastic, paper)
    baseIncrease: 0.015,
    sensors: {
      ultrasonic1: 'SENS_KLT1_ANO_U1',
      ultrasonic2: 'SENS_KLT1_ANO_U2',
      ultrasonic3: 'SENS_KLT1_ANO_U3',
      ultrasonic4: 'SENS_KLT1_ANO_U4',
      loadcell: 'SENS_KLT1_ANO_LC'
    }
  },
  Residue: {
    deviceId: 'DEV_KANTIN_LT1_RESIDUE',
    maxWeight: 35, // Residue has least waste
    baseIncrease: 0.008,
    sensors: {
      ultrasonic1: 'SENS_KLT1_RES_U1',
      ultrasonic2: 'SENS_KLT1_RES_U2',
      ultrasonic3: 'SENS_KLT1_RES_U3',
      ultrasonic4: 'SENS_KLT1_RES_U4',
      loadcell: 'SENS_KLT1_RES_LC'
    }
  }
};

const TRASHBIN_ID = 'TB_KANTIN_LT1';

/**
 * Calculate time multiplier based on hour (meal times have more waste)
 */
function getTimeMultiplier(hour) {
  if (hour >= 6 && hour < 9) return 1.8;   // Breakfast time
  if (hour >= 9 && hour < 11) return 1.2;  // Morning snack
  if (hour >= 11 && hour < 14) return 2.5; // Lunch peak
  if (hour >= 14 && hour < 17) return 1.0; // Afternoon
  if (hour >= 17 && hour < 20) return 1.5; // Dinner
  if (hour >= 20 && hour < 22) return 0.8; // Evening
  return 0.3; // Night (22:00 - 06:00)
}

/**
 * Calculate day multiplier (weekends have less waste)
 */
function getDayMultiplier(date) {
  const day = date.getDay();
  if (day === 0 || day === 6) return 0.4; // Sunday or Saturday
  return 1.0; // Weekdays
}

/**
 * Generate next collection date
 */
function getNextCollectionDate(currentDate) {
  const daysToAdd = Math.floor(Math.random() * (COLLECTION_INTERVAL_DAYS_MAX - COLLECTION_INTERVAL_DAYS_MIN + 1)) + COLLECTION_INTERVAL_DAYS_MIN;
  const nextDate = new Date(currentDate);
  nextDate.setDate(nextDate.getDate() + daysToAdd);
  nextDate.setHours(6 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0);
  return nextDate;
}

/**
 * Clean all existing data
 */
async function cleanExistingData() {
  console.log('🧹 Cleaning existing data...');

  try {
    await prisma.weightData.deleteMany();
    await prisma.volumeData.deleteMany();
    await prisma.deviceHealth.deleteMany();
    await prisma.binStatus.deleteMany();
    await prisma.binStatusHistory.deleteMany();
    await prisma.dailyAnalytics.deleteMany();
    await prisma.alertLog.deleteMany();
    await prisma.sensor.deleteMany();
    await prisma.device.deleteMany();
    await prisma.trashBin.deleteMany();

    console.log('✅ All data cleaned');
  } catch (error) {
    console.error('❌ Error cleaning data:', error);
    throw error;
  }
}

/**
 * Create bin structure for all 3 categories
 */
async function createBinStructure() {
  console.log('🏗️  Creating bin structure...');

  // Create TrashBin
  const trashBin = await prisma.trashBin.create({
    data: {
      trashbinid: TRASHBIN_ID,
      name: 'Kantin LT 1',
      location: 'Kantin',
      area: 'Food Court',
      floor: 'Lantai 1',
      capacity_liters: BIN_CAPACITY_LITERS,
      installation_date: new Date('2024-08-15'),
      status: 'active'
    }
  });
  console.log('  ✓ TrashBin created:', trashBin.name);

  // Create devices and sensors for all 3 categories
  const devices = [];
  const sensors = {};

  for (const [category, config] of Object.entries(CATEGORIES)) {
    // Create Device
    const device = await prisma.device.create({
      data: {
        deviceid: config.deviceId,
        trashbinid: TRASHBIN_ID,
        category: category,
        installation_date: new Date('2024-08-15'),
        status: 'active'
      }
    });
    devices.push(device);
    console.log(`  ✓ Device created: ${category}`);

    // Create Sensors (4 ultrasonic + 1 load cell)
    const categorySensors = await Promise.all([
      prisma.sensor.create({
        data: {
          sensorid: config.sensors.ultrasonic1,
          deviceid: config.deviceId,
          sensor_type: 'ultrasonic',
          sensor_position: '1',
          status: 'active'
        }
      }),
      prisma.sensor.create({
        data: {
          sensorid: config.sensors.ultrasonic2,
          deviceid: config.deviceId,
          sensor_type: 'ultrasonic',
          sensor_position: '2',
          status: 'active'
        }
      }),
      prisma.sensor.create({
        data: {
          sensorid: config.sensors.ultrasonic3,
          deviceid: config.deviceId,
          sensor_type: 'ultrasonic',
          sensor_position: '3',
          status: 'active'
        }
      }),
      prisma.sensor.create({
        data: {
          sensorid: config.sensors.ultrasonic4,
          deviceid: config.deviceId,
          sensor_type: 'ultrasonic',
          sensor_position: '4',
          status: 'active'
        }
      }),
      prisma.sensor.create({
        data: {
          sensorid: config.sensors.loadcell,
          deviceid: config.deviceId,
          sensor_type: 'load_cell',
          sensor_position: 'center',
          status: 'active'
        }
      })
    ]);
    sensors[category] = categorySensors;
    console.log(`  ✓ Sensors created for ${category}: 4 ultrasonic + 1 load cell`);
  }

  return { trashBin, devices, sensors };
}

/**
 * Generate sensor data for all categories
 */
async function generateSensorData() {
  console.log('📊 Generating sensor data for ALL 3 CATEGORIES (2 months, per minute)...');

  // Track state for each category independently
  const categoryStates = {};
  for (const [category, config] of Object.entries(CATEGORIES)) {
    categoryStates[category] = {
      currentWeight: 0.1,
      currentFillPercentage: 5.0,
      nextCollectionDate: getNextCollectionDate(START_DATE)
    };
  }

  let currentDate = new Date(START_DATE);
  let weightBatch = [];
  let volumeBatch = [];
  let batchSize = 1000;
  let totalRecords = 0;

  console.log(`  Start: ${START_DATE.toISOString()}`);
  console.log(`  End: ${END_DATE.toISOString()}`);

  while (currentDate < END_DATE) {
    const hour = currentDate.getHours();
    const timeMultiplier = getTimeMultiplier(hour);
    const dayMultiplier = getDayMultiplier(currentDate);

    // Generate data for each category
    for (const [category, config] of Object.entries(CATEGORIES)) {
      const state = categoryStates[category];

      // Check if collection event
      if (currentDate >= state.nextCollectionDate) {
        console.log(`  🗑️  ${category} collection at ${currentDate.toISOString().split('T')[0]}`);
        state.currentWeight = 0.1 + Math.random() * 0.5;
        state.currentFillPercentage = 3.0 + Math.random() * 3.0;
        state.nextCollectionDate = getNextCollectionDate(currentDate);
      }

      // Increase weight and volume
      const weightIncrease = config.baseIncrease * timeMultiplier * dayMultiplier * (0.8 + Math.random() * 0.4);
      const volumeIncrease = (weightIncrease / config.maxWeight) * 100;

      state.currentWeight = Math.min(config.maxWeight, state.currentWeight + weightIncrease);
      state.currentFillPercentage = Math.min(95, state.currentFillPercentage + volumeIncrease);

      // Add variations
      const weightVariation = (Math.random() - 0.5) * 0.1;
      const volumeVariation = (Math.random() - 0.5) * 1.0;

      const finalWeight = Math.max(0, state.currentWeight + weightVariation);
      const finalVolume = Math.max(0, Math.min(100, state.currentFillPercentage + volumeVariation));

      const distanceCm = BIN_HEIGHT_CM - (finalVolume / 100 * BIN_HEIGHT_CM);

      // Generate weight data
      weightBatch.push({
        weightdataid: `WD_${currentDate.getTime()}_${config.sensors.loadcell}`,
        sensorid: config.sensors.loadcell,
        weight_kg: parseFloat(finalWeight.toFixed(2)),
        raw_reading: parseFloat((finalWeight * (0.95 + Math.random() * 0.1)).toFixed(2)),
        timestamp: new Date(currentDate)
      });

      // Generate volume data for 4 ultrasonic sensors
      Object.values(config.sensors).slice(0, 4).forEach((sensorId) => {
        const sensorVariation = (Math.random() - 0.5) * 2;
        const sensorVolume = Math.max(0, Math.min(100, finalVolume + sensorVariation));
        const sensorDistance = BIN_HEIGHT_CM - (sensorVolume / 100 * BIN_HEIGHT_CM);

        volumeBatch.push({
          volumedataid: `VD_${currentDate.getTime()}_${sensorId}`,
          sensorid: sensorId,
          distance_cm: parseFloat(sensorDistance.toFixed(1)),
          fill_percentage: parseFloat(sensorVolume.toFixed(1)),
          raw_reading: parseFloat((sensorDistance * (0.95 + Math.random() * 0.1)).toFixed(1)),
          timestamp: new Date(currentDate)
        });
      });
    }

    totalRecords++;

    // Insert batch
    if (weightBatch.length >= batchSize * 3) {
      await prisma.weightData.createMany({ data: weightBatch });
      await prisma.volumeData.createMany({ data: volumeBatch });
      console.log(`  ✓ Inserted ${totalRecords} records (${currentDate.toISOString().split('T')[0]})`);
      weightBatch = [];
      volumeBatch = [];
    }

    // Move to next minute
    currentDate.setMinutes(currentDate.getMinutes() + 1);
  }

  // Insert remaining data
  if (weightBatch.length > 0) {
    await prisma.weightData.createMany({ data: weightBatch });
    await prisma.volumeData.createMany({ data: volumeBatch });
    console.log(`  ✓ Inserted remaining records`);
  }

  console.log(`✅ Total records generated: ${totalRecords} minutes`);
  console.log(`   Weight data: ${totalRecords * 3} records (3 categories)`);
  console.log(`   Volume data: ${totalRecords * 12} records (3 categories × 4 sensors)`);
}

/**
 * Create current bin status for all devices
 */
async function createBinStatus() {
  console.log('📋 Creating current bin status for all categories...');

  for (const [category, config] of Object.entries(CATEGORIES)) {
    // Get latest readings
    const latestWeight = await prisma.weightData.findFirst({
      where: { sensorid: config.sensors.loadcell },
      orderBy: { timestamp: 'desc' }
    });

    const latestVolumes = await prisma.volumeData.findMany({
      where: {
        sensorid: { in: Object.values(config.sensors).slice(0, 4) }
      },
      orderBy: { timestamp: 'desc' },
      take: 4
    });

    const avgVolume = latestVolumes.reduce((sum, v) => sum + v.fill_percentage, 0) / latestVolumes.length;

    let status = 'low';
    if (avgVolume >= 80) status = 'full';
    else if (avgVolume >= 60) status = 'high';
    else if (avgVolume >= 30) status = 'medium';

    await prisma.binStatus.create({
      data: {
        binstatusid: `BS_KANTIN_LT1_${category.toUpperCase()}`,
        deviceid: config.deviceId,
        total_weight_kg: latestWeight?.weight_kg || 0,
        average_volume_percentage: parseFloat(avgVolume.toFixed(1)),
        status: status,
        condition: 'even',
        sensor_contributions: {
          [config.sensors.ultrasonic1]: latestVolumes[0]?.fill_percentage || 0,
          [config.sensors.ultrasonic2]: latestVolumes[1]?.fill_percentage || 0,
          [config.sensors.ultrasonic3]: latestVolumes[2]?.fill_percentage || 0,
          [config.sensors.ultrasonic4]: latestVolumes[3]?.fill_percentage || 0
        }
      }
    });

    console.log(`  ✓ ${category}: ${status} (${avgVolume.toFixed(1)}% full, ${latestWeight?.weight_kg || 0} kg)`);
  }
}

/**
 * Generate device health data for all devices
 */
async function generateDeviceHealth() {
  console.log('🔋 Generating device health data for all categories (hourly)...');

  for (const [category, config] of Object.entries(CATEGORIES)) {
    let currentDate = new Date(START_DATE);
    let battery = 100;
    const healthBatch = [];
    let count = 0;

    while (currentDate < END_DATE) {
      battery = Math.max(20, battery - 0.02);

      healthBatch.push({
        healthid: `DH_${currentDate.getTime()}_${config.deviceId}`,
        deviceid: config.deviceId,
        battery_percentage: parseFloat(battery.toFixed(1)),
        error_count_24h: Math.random() < 0.98 ? 0 : 1,
        error_details: Math.random() < 0.98 ? null : { type: 'minor_drift' },
        timestamp: new Date(currentDate)
      });

      count++;
      currentDate.setHours(currentDate.getHours() + 1);
    }

    await prisma.deviceHealth.createMany({ data: healthBatch });
    console.log(`  ✓ ${category}: ${count} hourly health records`);
  }
}

/**
 * Generate daily analytics data
 */
async function generateDailyAnalytics() {
  console.log('📈 Generating daily analytics data for all categories...');

  for (const [category, config] of Object.entries(CATEGORIES)) {
    let currentDate = new Date(START_DATE);
    currentDate.setHours(0, 0, 0, 0); // Start at midnight
    const analyticsBatch = [];
    let count = 0;

    while (currentDate < END_DATE) {
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);

      // Get all weight data for this day
      const dayWeightData = await prisma.weightData.findMany({
        where: {
          sensorid: config.sensors.loadcell,
          timestamp: {
            gte: currentDate,
            lt: nextDate
          }
        },
        orderBy: { timestamp: 'asc' }
      });

      // Get all volume data for this day (from all 4 ultrasonic sensors)
      const dayVolumeData = await prisma.volumeData.findMany({
        where: {
          sensorid: {
            in: Object.values(config.sensors).slice(0, 4)
          },
          timestamp: {
            gte: currentDate,
            lt: nextDate
          }
        },
        orderBy: { timestamp: 'asc' }
      });

      if (dayWeightData.length > 0 && dayVolumeData.length > 0) {
        // Calculate aggregates
        const weights = dayWeightData.map(d => d.weight_kg);
        const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;
        const maxWeight = Math.max(...weights);

        const volumes = dayVolumeData.map(d => d.fill_percentage);
        const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
        const maxVolume = Math.max(...volumes);

        // Calculate collection frequency (count weight drops > 50%)
        let collections = 0;
        for (let i = 1; i < weights.length; i++) {
          if (weights[i - 1] - weights[i] > weights[i - 1] * 0.5) {
            collections++;
          }
        }

        // Calculate density (kg per percentage point)
        const density = avgVolume > 0 ? avgWeight / avgVolume : 0;

        // Create hourly patterns (simplified)
        const hourlyPatterns = {};
        for (let hour = 0; hour < 24; hour++) {
          const hourStart = new Date(currentDate);
          hourStart.setHours(hour, 0, 0, 0);
          const hourEnd = new Date(hourStart);
          hourEnd.setHours(hour + 1, 0, 0, 0);

          const hourWeights = dayWeightData.filter(d =>
            d.timestamp >= hourStart && d.timestamp < hourEnd
          ).map(d => d.weight_kg);

          if (hourWeights.length > 0) {
            hourlyPatterns[hour] = {
              avg: hourWeights.reduce((a, b) => a + b, 0) / hourWeights.length,
              count: hourWeights.length
            };
          }
        }

        analyticsBatch.push({
          analyticsid: `DA_${currentDate.getTime()}_${config.deviceId}`,
          deviceid: config.deviceId,
          analysis_date: new Date(currentDate),
          avg_weight: parseFloat(avgWeight.toFixed(2)),
          max_weight: parseFloat(maxWeight.toFixed(2)),
          avg_volume: parseFloat(avgVolume.toFixed(2)),
          max_volume: parseFloat(maxVolume.toFixed(2)),
          collection_frequency: collections,
          waste_density: parseFloat(density.toFixed(3)),
          hourly_patterns: hourlyPatterns
        });

        count++;
      }

      // Move to next day
      currentDate = nextDate;
    }

    if (analyticsBatch.length > 0) {
      await prisma.dailyAnalytics.createMany({ data: analyticsBatch });
      console.log(`  ✓ ${category}: ${count} daily analytics records`);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   Kantin LT 1 - ALL 3 CATEGORIES Data Generator         ║');
  console.log('║   (Organic, Anorganic, Residue)                          ║');
  console.log('║   2 Months of Minute-by-Minute Data                      ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const startTime = Date.now();

  try {
    await cleanExistingData();
    await createBinStructure();
    await generateSensorData();
    await createBinStatus();
    await generateDeviceHealth();
    await generateDailyAnalytics();

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║   ✅ DATA GENERATION COMPLETED                            ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`📊 Data generated for 3 waste categories`);
    console.log('\n✨ You can now view the data in your application!');

  } catch (error) {
    console.error('\n❌ Error during data generation:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
