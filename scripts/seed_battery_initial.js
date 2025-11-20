/**
 * Battery Initialization Script
 *
 * This script initializes battery percentage to 94% for all devices
 * Run this after database migration to set up the battery system
 *
 * Usage:
 *   node scripts/seed_battery_initial.js
 */

const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

const INITIAL_BATTERY_PERCENTAGE = 94.0;

async function initializeBatteries() {
  try {
    console.log('🔋 Initializing battery system...\n');

    // Get all devices
    const devices = await prisma.device.findMany({
      select: {
        deviceid: true,
        category: true,
        trashbinid: true,
        status: true
      }
    });

    console.log(`Found ${devices.length} devices to initialize\n`);

    let successCount = 0;
    let skipCount = 0;

    for (const device of devices) {
      const deviceId = device.deviceid;

      // Check if device already has battery data
      const existingHealth = await prisma.deviceHealth.findFirst({
        where: { deviceid: deviceId },
        orderBy: { timestamp: 'desc' }
      });

      if (existingHealth && existingHealth.battery_percentage !== null) {
        console.log(`⏭️  Skipping ${deviceId} - already has battery: ${existingHealth.battery_percentage}%`);
        skipCount++;
        continue;
      }

      // Create new battery record
      const healthId = `DH-${deviceId}-INIT-${Date.now()}`;

      await prisma.deviceHealth.create({
        data: {
          healthid: healthId,
          deviceid: deviceId,
          battery_percentage: INITIAL_BATTERY_PERCENTAGE,
          error_count_24h: existingHealth?.error_count_24h ?? 0,
          timestamp: new Date()
        }
      });

      console.log(`✅ Initialized ${deviceId} (${device.category}) → 94%`);
      successCount++;

      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('🎉 Battery initialization complete!');
    console.log(`${'='.repeat(60)}`);
    console.log(`✅ Successfully initialized: ${successCount} devices`);
    console.log(`⏭️  Skipped (already initialized): ${skipCount} devices`);
    console.log(`📊 Total devices: ${devices.length}`);
    console.log(`${'='.repeat(60)}\n`);

  } catch (error) {
    console.error('❌ Error initializing batteries:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  initializeBatteries()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeBatteries };
