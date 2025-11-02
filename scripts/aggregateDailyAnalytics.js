/**
 * Aggregate Daily Analytics from Raw Sensor Data
 *
 * This script aggregates weightData and volumeData into the dailyAnalytics table
 * Run this script after seeding data or periodically to update analytics
 *
 * To run: node scripts/aggregateDailyAnalytics.js
 */

const { prisma } = require('../src/config/prisma');

async function aggregateDailyAnalytics() {
  console.log('📊 Aggregating daily analytics from raw sensor data...\n');

  try {
    // Get all devices
    const devices = await prisma.device.findMany({
      select: { deviceid: true, category: true }
    });

    console.log(`Found ${devices.length} devices\n`);

    for (const device of devices) {
      console.log(`Processing device: ${device.deviceid} (${device.category})`);

      // Get date range of data for this device
      const dateRangeQuery = `
        SELECT
          DATE(MIN(timestamp)) as min_date,
          DATE(MAX(timestamp)) as max_date
        FROM weightdata wd
        JOIN sensor s ON wd.sensorid = s.sensorid
        WHERE s.deviceid = $1
      `;

      const dateRange = await prisma.$queryRawUnsafe(dateRangeQuery, device.deviceid);

      if (!dateRange[0] || !dateRange[0].min_date) {
        console.log('  No data found, skipping...\n');
        continue;
      }

      const minDate = new Date(dateRange[0].min_date);
      const maxDate = new Date(dateRange[0].max_date);

      console.log(`  Date range: ${minDate.toISOString().split('T')[0]} to ${maxDate.toISOString().split('T')[0]}`);

      // Aggregate data day by day
      let currentDate = new Date(minDate);
      let recordsCreated = 0;

      while (currentDate <= maxDate) {
        const nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() + 1);

        // Aggregate weight data for this day
        const weightAggQuery = `
          SELECT
            AVG(wd.weight_kg) as avg_weight,
            MAX(wd.weight_kg) as max_weight,
            MIN(wd.weight_kg) as min_weight,
            COUNT(*) as weight_readings
          FROM weightdata wd
          JOIN sensor s ON wd.sensorid = s.sensorid
          WHERE s.deviceid = $1
            AND wd.timestamp >= $2::timestamp
            AND wd.timestamp < $3::timestamp
        `;

        const weightAgg = await prisma.$queryRawUnsafe(
          weightAggQuery,
          device.deviceid,
          currentDate.toISOString(),
          nextDate.toISOString()
        );

        // Aggregate volume data for this day
        const volumeAggQuery = `
          SELECT
            AVG(vd.fill_percentage) as avg_volume,
            MAX(vd.fill_percentage) as max_volume,
            MIN(vd.fill_percentage) as min_volume,
            COUNT(*) as volume_readings
          FROM volumedata vd
          JOIN sensor s ON vd.sensorid = s.sensorid
          WHERE s.deviceid = $1
            AND vd.timestamp >= $2::timestamp
            AND vd.timestamp < $3::timestamp
        `;

        const volumeAgg = await prisma.$queryRawUnsafe(
          volumeAggQuery,
          device.deviceid,
          currentDate.toISOString(),
          nextDate.toISOString()
        );

        if (weightAgg[0]?.weight_readings > 0) {
          const avgWeight = parseFloat(weightAgg[0].avg_weight) || 0;
          const maxWeight = parseFloat(weightAgg[0].max_weight) || 0;
          const avgVolume = parseFloat(volumeAgg[0]?.avg_volume) || 0;
          const maxVolume = parseFloat(volumeAgg[0]?.max_volume) || 0;

          // Calculate waste density (kg/liter)
          // Assuming bin capacity is 120 liters
          const binCapacityLiters = 120;
          const volumeLiters = (avgVolume / 100) * binCapacityLiters;
          const wasteDensity = volumeLiters > 0 ? avgWeight / volumeLiters : 0;

          // Detect collection events (weight drops significantly)
          const collectionFrequency = maxWeight - avgWeight > 10 ? 1 : 0;

          // Create or update daily analytics record
          const analyticsId = `DA_${currentDate.toISOString().split('T')[0]}_${device.deviceid}`;

          await prisma.dailyAnalytics.upsert({
            where: { analyticsid: analyticsId },
            update: {
              avg_weight: parseFloat(avgWeight.toFixed(2)),
              max_weight: parseFloat(maxWeight.toFixed(2)),
              avg_volume: parseFloat(avgVolume.toFixed(2)),
              max_volume: parseFloat(maxVolume.toFixed(2)),
              collection_frequency: collectionFrequency,
              waste_density: parseFloat(wasteDensity.toFixed(3))
            },
            create: {
              analyticsid: analyticsId,
              deviceid: device.deviceid,
              analysis_date: currentDate,
              avg_weight: parseFloat(avgWeight.toFixed(2)),
              max_weight: parseFloat(maxWeight.toFixed(2)),
              avg_volume: parseFloat(avgVolume.toFixed(2)),
              max_volume: parseFloat(maxVolume.toFixed(2)),
              collection_frequency: collectionFrequency,
              waste_density: parseFloat(wasteDensity.toFixed(3))
            }
          });

          recordsCreated++;
        }

        currentDate = nextDate;
      }

      console.log(`  ✓ Created/updated ${recordsCreated} daily analytics records\n`);
    }

    // Verify results
    const totalRecords = await prisma.dailyAnalytics.count();
    console.log(`✅ Total daily analytics records in database: ${totalRecords}`);

  } catch (error) {
    console.error('❌ Error aggregating daily analytics:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
aggregateDailyAnalytics()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
