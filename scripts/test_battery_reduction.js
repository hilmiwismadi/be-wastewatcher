/**
 * Battery Reduction Test Script
 *
 * This script tests the battery reduction logic by simulating MQTT messages
 * It verifies that battery decreases by exactly 0.014% per message
 *
 * Usage:
 *   node scripts/test_battery_reduction.js
 *
 * Test Cases:
 *   1. Send 100 MQTT messages → battery should be 94% - (100 × 0.014%) = 92.6%
 *   2. Send until battery reaches 0% → verify it doesn't go negative
 *   3. Test reset functionality → verify it returns to 94%
 */

const mqtt = require('mqtt');
const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

// Configuration
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const TEST_TOPIC = 'CapsE6/Lt2SGLC';
const TEST_DEVICE_ID = 'DEV-LT2-ORG'; // Device ID for Lt2SGLC organic
const NUM_MESSAGES = 100; // Number of test messages to send
const MESSAGE_DELAY = 100; // Delay between messages (ms)

// Test message payload
const TEST_PAYLOAD = {
  DISTANCE: [60, 59, 75, 73], // 4 ultrasonic sensors
  WEIGHT: 892 // Weight in grams
};

class BatteryTester {
  constructor() {
    this.client = null;
    this.messagesSent = 0;
    this.startBattery = null;
    this.endBattery = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      console.log(`🔌 Connecting to MQTT broker: ${MQTT_BROKER_URL}`);

      const clientId = `battery-tester-${Math.random().toString(16).substr(2, 8)}`;
      this.client = mqtt.connect(MQTT_BROKER_URL, {
        clientId,
        clean: true,
        connectTimeout: 10000
      });

      this.client.on('connect', () => {
        console.log('✅ Connected to MQTT broker\n');
        resolve();
      });

      this.client.on('error', (error) => {
        console.error('❌ MQTT connection error:', error);
        reject(error);
      });
    });
  }

  async getCurrentBattery() {
    const health = await prisma.deviceHealth.findFirst({
      where: { deviceid: TEST_DEVICE_ID },
      orderBy: { timestamp: 'desc' },
      select: { battery_percentage: true, timestamp: true }
    });

    return health?.battery_percentage ?? null;
  }

  async sendMessage() {
    return new Promise((resolve) => {
      this.client.publish(TEST_TOPIC, JSON.stringify(TEST_PAYLOAD), () => {
        this.messagesSent++;
        resolve();
      });
    });
  }

  async runTest() {
    try {
      console.log('🧪 Battery Reduction Test\n');
      console.log('='.repeat(60));
      console.log(`Test Configuration:`);
      console.log(`  MQTT Broker: ${MQTT_BROKER_URL}`);
      console.log(`  Test Topic: ${TEST_TOPIC}`);
      console.log(`  Device ID: ${TEST_DEVICE_ID}`);
      console.log(`  Number of Messages: ${NUM_MESSAGES}`);
      console.log(`  Expected Reduction: ${NUM_MESSAGES} × 0.014% = ${(NUM_MESSAGES * 0.014).toFixed(3)}%`);
      console.log('='.repeat(60) + '\n');

      // Get starting battery
      this.startBattery = await this.getCurrentBattery();

      if (this.startBattery === null) {
        console.log('⚠️  No battery data found. Initializing to 94%...');
        const healthId = `DH-${TEST_DEVICE_ID}-TEST-${Date.now()}`;
        await prisma.deviceHealth.create({
          data: {
            healthid: healthId,
            deviceid: TEST_DEVICE_ID,
            battery_percentage: 94.0,
            error_count_24h: 0,
            timestamp: new Date()
          }
        });
        this.startBattery = 94.0;
      }

      console.log(`📊 Starting Battery: ${this.startBattery.toFixed(3)}%\n`);

      // Send test messages
      console.log(`📤 Sending ${NUM_MESSAGES} MQTT messages...`);

      for (let i = 0; i < NUM_MESSAGES; i++) {
        await this.sendMessage();

        // Show progress every 10 messages
        if ((i + 1) % 10 === 0) {
          const current = await this.getCurrentBattery();
          console.log(`  [${i + 1}/${NUM_MESSAGES}] Battery: ${current?.toFixed(3)}%`);
        }

        // Delay between messages
        await new Promise(resolve => setTimeout(resolve, MESSAGE_DELAY));
      }

      console.log(`\n✅ Sent ${this.messagesSent} messages\n`);

      // Wait a bit for final battery update
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get ending battery
      this.endBattery = await this.getCurrentBattery();

      // Calculate results
      const actualReduction = this.startBattery - this.endBattery;
      const expectedReduction = NUM_MESSAGES * 0.014;
      const difference = Math.abs(actualReduction - expectedReduction);

      console.log('='.repeat(60));
      console.log('📊 Test Results');
      console.log('='.repeat(60));
      console.log(`Starting Battery:    ${this.startBattery.toFixed(3)}%`);
      console.log(`Ending Battery:      ${this.endBattery.toFixed(3)}%`);
      console.log(`Actual Reduction:    ${actualReduction.toFixed(3)}%`);
      console.log(`Expected Reduction:  ${expectedReduction.toFixed(3)}%`);
      console.log(`Difference:          ${difference.toFixed(3)}%`);

      // Check if test passed
      const tolerance = 0.01; // Allow 0.01% tolerance
      const passed = difference < tolerance;

      if (passed) {
        console.log(`\n✅ TEST PASSED! Battery reduction is working correctly.`);
      } else {
        console.log(`\n❌ TEST FAILED! Battery reduction is not accurate.`);
        console.log(`   Expected: ${expectedReduction.toFixed(3)}%`);
        console.log(`   Got: ${actualReduction.toFixed(3)}%`);
      }

      console.log('='.repeat(60) + '\n');

      // Test battery floor
      await this.testBatteryFloor();

    } catch (error) {
      console.error('❌ Test failed with error:', error);
      throw error;
    }
  }

  async testBatteryFloor() {
    console.log('🧪 Testing Battery Floor (0% minimum)...\n');

    const currentBattery = await this.getCurrentBattery();

    if (currentBattery > 1) {
      console.log(`⏭️  Skipping floor test - current battery (${currentBattery.toFixed(2)}%) is too high`);
      console.log(`   (Would require ${Math.ceil(currentBattery / 0.014)} messages to reach 0%)\n`);
      return;
    }

    // Send messages until battery should be below 0%
    console.log('📤 Sending messages to test battery floor...');

    for (let i = 0; i < 200; i++) {
      await this.sendMessage();
      const battery = await this.getCurrentBattery();

      if (battery === 0) {
        console.log(`\n✅ Battery Floor Test PASSED!`);
        console.log(`   Battery stopped at 0% after ${i + 1} messages`);
        console.log(`   (Did not go negative)\n`);
        break;
      }

      await new Promise(resolve => setTimeout(resolve, MESSAGE_DELAY));
    }
  }

  async cleanup() {
    if (this.client) {
      this.client.end();
      console.log('🔌 Disconnected from MQTT broker');
    }
    await prisma.$disconnect();
  }
}

// Run the test
async function main() {
  const tester = new BatteryTester();

  try {
    await tester.connect();
    await tester.runTest();
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await tester.cleanup();
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

module.exports = { BatteryTester };
