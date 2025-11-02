/**
 * Prisma Usage Examples for WasteWatcher
 *
 * This file contains practical examples of using Prisma ORM
 * Run individual functions to see Prisma in action
 *
 * To run: node src/examples/prismaExamples.js
 */

const { prisma } = require('../config/prisma');

// ============================================================================
// 1. BASIC CRUD OPERATIONS
// ============================================================================

async function example1_getAllTrashBins() {
  console.log('\n=== Example 1: Get All Trash Bins ===');

  const bins = await prisma.trashBin.findMany({
    orderBy: { name: 'asc' }
  });

  console.log(`Found ${bins.length} trash bins:`);
  bins.forEach(bin => {
    console.log(`- ${bin.name} (${bin.location})`);
  });

  return bins;
}

async function example2_getTrashBinWithDevices() {
  console.log('\n=== Example 2: Get Trash Bin with Devices ===');

  const bin = await prisma.trashBin.findUnique({
    where: { trashbinId: 'TB001' },
    include: {
      devices: {
        include: {
          sensors: true,
          binStatus: true
        }
      }
    }
  });

  console.log('Bin:', bin.name);
  console.log('Devices:', bin.devices.length);
  bin.devices.forEach(device => {
    console.log(`  - Device ${device.deviceId} (${device.category})`);
    console.log(`    Sensors: ${device.sensors.length}`);
    console.log(`    Status: ${device.binStatus?.status || 'N/A'}`);
  });

  return bin;
}

async function example3_createNewSensor() {
  console.log('\n=== Example 3: Create New Sensor ===');

  try {
    const newSensor = await prisma.sensor.create({
      data: {
        sensorId: 'SENS_TEST_' + Date.now(),
        deviceId: 'DEV001',
        sensor_type: 'ultrasonic',
        sensor_position: '5',
        status: 'active',
        calibration_factor: 1.0
      }
    });

    console.log('Created sensor:', newSensor.sensorId);

    // Clean up
    await prisma.sensor.delete({
      where: { sensorId: newSensor.sensorId }
    });
    console.log('Cleaned up test sensor');

    return newSensor;
  } catch (error) {
    console.error('Error creating sensor:', error.message);
    throw error;
  }
}

// ============================================================================
// 2. QUERYING SENSOR DATA
// ============================================================================

async function example4_getLatestWeightData() {
  console.log('\n=== Example 4: Get Latest Weight Data ===');

  const latestWeights = await prisma.weightData.findMany({
    where: { sensorId: 'SENS005' },
    orderBy: { timestamp: 'desc' },
    take: 5,
    include: {
      sensor: {
        include: {
          device: {
            include: {
              trashBin: true
            }
          }
        }
      }
    }
  });

  console.log('Latest 5 weight readings:');
  latestWeights.forEach(weight => {
    console.log(
      `  ${weight.timestamp.toISOString()}: ${weight.weight_kg} kg ` +
      `(Bin: ${weight.sensor.device.trashBin.name})`
    );
  });

  return latestWeights;
}

async function example5_getAverageFillLevel() {
  console.log('\n=== Example 5: Get Average Fill Level (Today) ===');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const avgFill = await prisma.volumeData.aggregate({
    where: {
      sensorId: 'SENS001',
      timestamp: { gte: today }
    },
    _avg: { fill_percentage: true },
    _min: { fill_percentage: true },
    _max: { fill_percentage: true },
    _count: { volumeDataId: true }
  });

  console.log('Fill statistics for today:');
  console.log(`  Average: ${avgFill._avg.fill_percentage?.toFixed(2)}%`);
  console.log(`  Min: ${avgFill._min.fill_percentage}%`);
  console.log(`  Max: ${avgFill._max.fill_percentage}%`);
  console.log(`  Readings: ${avgFill._count.volumeDataId}`);

  return avgFill;
}

// ============================================================================
// 3. FILTERING AND SEARCHING
// ============================================================================

async function example6_findFullBins() {
  console.log('\n=== Example 6: Find Bins Over 80% Full ===');

  const fullBins = await prisma.binStatus.findMany({
    where: {
      average_volume_percentage: { gte: 80 }
    },
    include: {
      device: {
        include: {
          trashBin: true
        }
      }
    },
    orderBy: {
      average_volume_percentage: 'desc'
    }
  });

  console.log(`Found ${fullBins.length} bins over 80% full:`);
  fullBins.forEach(binStatus => {
    console.log(
      `  - ${binStatus.device.trashBin.name}: ${binStatus.average_volume_percentage}% full, ` +
      `${binStatus.total_weight_kg} kg`
    );
  });

  return fullBins;
}

async function example7_searchBinsByLocation() {
  console.log('\n=== Example 7: Search Bins by Location ===');

  const searchTerm = 'Cafeteria';

  const bins = await prisma.trashBin.findMany({
    where: {
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { location: { contains: searchTerm, mode: 'insensitive' } }
      ]
    }
  });

  console.log(`Bins matching "${searchTerm}":`);
  bins.forEach(bin => {
    console.log(`  - ${bin.name} at ${bin.location}`);
  });

  return bins;
}

// ============================================================================
// 4. ANALYTICS AND REPORTING
// ============================================================================

async function example8_getDailyAnalytics() {
  console.log('\n=== Example 8: Get Daily Analytics (Last 7 Days) ===');

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const analytics = await prisma.dailyAnalytics.findMany({
    where: {
      deviceId: 'DEV001',
      analysis_date: { gte: sevenDaysAgo }
    },
    orderBy: { analysis_date: 'desc' },
    include: {
      device: {
        include: {
          trashBin: true
        }
      }
    }
  });

  console.log('Daily analytics (last 7 days):');
  analytics.forEach(day => {
    console.log(
      `  ${day.analysis_date.toDateString()}: ` +
      `Avg ${day.avg_weight?.toFixed(2)} kg, ` +
      `Max ${day.max_volume?.toFixed(1)}% full, ` +
      `Density ${day.waste_density?.toFixed(3)} kg/L`
    );
  });

  return analytics;
}

async function example9_getDeviceHealthStatus() {
  console.log('\n=== Example 9: Get Device Health Status ===');

  const devices = await prisma.device.findMany({
    include: {
      deviceHealth: {
        orderBy: { timestamp: 'desc' },
        take: 1
      },
      trashBin: true
    }
  });

  console.log('Device health status:');
  devices.forEach(device => {
    const latestHealth = device.deviceHealth[0];
    if (latestHealth) {
      console.log(
        `  ${device.trashBin.name} (${device.deviceId}): ` +
        `Battery ${latestHealth.battery_percentage}%, ` +
        `Errors: ${latestHealth.error_count_24h}`
      );
    }
  });

  return devices;
}

// ============================================================================
// 5. COMPLEX QUERIES
// ============================================================================

async function example10_getBinStatusWithHistory() {
  console.log('\n=== Example 10: Get Bin Status with Recent History ===');

  const binStatus = await prisma.binStatus.findUnique({
    where: { deviceId: 'DEV001' },
    include: {
      device: {
        include: {
          trashBin: true,
          binStatusHistory: {
            orderBy: { recorded_at: 'desc' },
            take: 5
          }
        }
      }
    }
  });

  if (binStatus) {
    console.log(`Current Status for ${binStatus.device.trashBin.name}:`);
    console.log(`  Status: ${binStatus.status}`);
    console.log(`  Fill: ${binStatus.average_volume_percentage}%`);
    console.log(`  Weight: ${binStatus.total_weight_kg} kg`);
    console.log(`  Condition: ${binStatus.condition}`);

    console.log('\nRecent History:');
    binStatus.device.binStatusHistory.forEach(history => {
      console.log(
        `  ${history.recorded_at.toLocaleString()}: ` +
        `${history.status} (${history.average_volume_percentage}%)`
      );
    });
  }

  return binStatus;
}

async function example11_getActiveAlerts() {
  console.log('\n=== Example 11: Get Active Alerts ===');

  const activeAlerts = await prisma.alertLog.findMany({
    where: {
      resolved_at: null  // Not resolved yet
    },
    include: {
      device: {
        include: {
          trashBin: true
        }
      },
      sensor: true
    },
    orderBy: { triggered_at: 'desc' }
  });

  console.log(`Active alerts: ${activeAlerts.length}`);
  activeAlerts.forEach(alert => {
    const location = alert.device?.trashBin?.name || 'Unknown';
    console.log(
      `  [${alert.alert_type}] ${location}: ${alert.message} ` +
      `(triggered ${alert.triggered_at.toLocaleString()})`
    );
  });

  return activeAlerts;
}

// ============================================================================
// 6. TRANSACTIONS
// ============================================================================

async function example12_updateBinStatusWithTransaction() {
  console.log('\n=== Example 12: Update Bin Status with Transaction ===');

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update current status
      const updatedStatus = await tx.binStatus.update({
        where: { deviceId: 'DEV001' },
        data: {
          average_volume_percentage: 65.5,
          status: 'high',
          last_updated: new Date()
        }
      });

      // 2. Create history record
      const historyRecord = await tx.binStatusHistory.create({
        data: {
          historyId: 'HIST_TEST_' + Date.now(),
          deviceId: 'DEV001',
          total_weight_kg: updatedStatus.total_weight_kg,
          average_volume_percentage: 65.5,
          status: 'high',
          trigger_reason: 'scheduled_update'
        }
      });

      // 3. Check if alert needed (if > 80%)
      if (updatedStatus.average_volume_percentage > 80) {
        await tx.alertLog.create({
          data: {
            alertId: 'ALERT_TEST_' + Date.now(),
            deviceId: 'DEV001',
            alert_type: 'bin_full',
            message: 'Bin is over 80% full - collection needed',
            triggered_at: new Date()
          }
        });
      }

      return { updatedStatus, historyRecord };
    });

    console.log('Transaction completed successfully');
    console.log('  Updated status:', result.updatedStatus.status);
    console.log('  Created history:', result.historyRecord.historyId);

    return result;
  } catch (error) {
    console.error('Transaction failed:', error.message);
    // All changes are automatically rolled back
    throw error;
  }
}

// ============================================================================
// 7. RAW SQL (for complex queries)
// ============================================================================

async function example13_rawSQLQuery() {
  console.log('\n=== Example 13: Raw SQL Query ===');

  const result = await prisma.$queryRaw`
    SELECT
      d.deviceId,
      d.category,
      tb.name as bin_name,
      AVG(w.weight_kg) as avg_weight,
      COUNT(w.weightDataId) as reading_count
    FROM Device d
    JOIN TrashBin tb ON d.trashbinId = tb.trashbinId
    JOIN Sensor s ON d.deviceId = s.deviceId AND s.sensor_type = 'load_cell'
    JOIN WeightData w ON s.sensorId = w.sensorId
    WHERE w.timestamp >= NOW() - INTERVAL '7 days'
    GROUP BY d.deviceId, d.category, tb.name
    ORDER BY avg_weight DESC
  `;

  console.log('Weight statistics by device (last 7 days):');
  result.forEach(row => {
    console.log(
      `  ${row.bin_name} (${row.category}): ` +
      `Avg ${Number(row.avg_weight).toFixed(2)} kg ` +
      `(${row.reading_count} readings)`
    );
  });

  return result;
}

// ============================================================================
// MAIN FUNCTION - Run All Examples
// ============================================================================

async function runAllExamples() {
  try {
    console.log('==========================================');
    console.log('   Prisma ORM Examples - WasteWatcher');
    console.log('==========================================');

    await example1_getAllTrashBins();
    await example2_getTrashBinWithDevices();
    await example3_createNewSensor();
    await example4_getLatestWeightData();
    await example5_getAverageFillLevel();
    await example6_findFullBins();
    await example7_searchBinsByLocation();
    await example8_getDailyAnalytics();
    await example9_getDeviceHealthStatus();
    await example10_getBinStatusWithHistory();
    await example11_getActiveAlerts();
    await example12_updateBinStatusWithTransaction();
    await example13_rawSQLQuery();

    console.log('\n==========================================');
    console.log('   All examples completed successfully!');
    console.log('==========================================\n');
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  example1_getAllTrashBins,
  example2_getTrashBinWithDevices,
  example3_createNewSensor,
  example4_getLatestWeightData,
  example5_getAverageFillLevel,
  example6_findFullBins,
  example7_searchBinsByLocation,
  example8_getDailyAnalytics,
  example9_getDeviceHealthStatus,
  example10_getBinStatusWithHistory,
  example11_getActiveAlerts,
  example12_updateBinStatusWithTransaction,
  example13_rawSQLQuery,
  runAllExamples
};

// Run if executed directly
if (require.main === module) {
  runAllExamples();
}
