const DeviceModel = require('../models/deviceModel');
const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

class DeviceController {
  // Get all devices
  static async getAll(req, res) {
    try {
      const { trashbinid } = req.query;

      let devices;
      if (trashbinid) {
        devices = await DeviceModel.getByTrashBinId(trashbinid);
      } else {
        devices = await DeviceModel.getAll();
      }

      res.json({
        success: true,
        data: devices,
        count: devices.length
      });
    } catch (error) {
      console.error('Error fetching devices:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch devices',
        message: error.message
      });
    }
  }

  // Get device by ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const device = await DeviceModel.getById(id);

      if (!device) {
        return res.status(404).json({
          success: false,
          error: 'Device not found'
        });
      }

      res.json({
        success: true,
        data: device
      });
    } catch (error) {
      console.error('Error fetching device:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch device',
        message: error.message
      });
    }
  }

  // Get devices by category
  static async getByCategory(req, res) {
    try {
      const { category } = req.params;
      const devices = await DeviceModel.getByCategory(category);

      res.json({
        success: true,
        data: devices,
        count: devices.length,
        category: category
      });
    } catch (error) {
      console.error('Error fetching devices by category:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch devices by category',
        message: error.message
      });
    }
  }

  // Get devices with health status
  static async getWithHealthStatus(req, res) {
    try {
      const devices = await DeviceModel.getWithHealthStatus();
      res.json({
        success: true,
        data: devices,
        count: devices.length
      });
    } catch (error) {
      console.error('Error fetching devices with health status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch devices with health status',
        message: error.message
      });
    }
  }

  // Get current status of specific device
  static async getCurrentStatus(req, res) {
    try {
      const { id } = req.params;
      const status = await DeviceModel.getCurrentStatus(id);

      if (!status) {
        return res.status(404).json({
          success: false,
          error: 'Device not found'
        });
      }

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Error fetching device status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch device status',
        message: error.message
      });
    }
  }

  // Get device statistics
  static async getStatistics(req, res) {
    try {
      const statistics = await DeviceModel.getStatistics();
      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('Error fetching device statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch device statistics',
        message: error.message
      });
    }
  }

  // Create new device
  static async create(req, res) {
    try {
      const deviceData = req.body;
      const newDevice = await DeviceModel.create(deviceData);

      res.status(201).json({
        success: true,
        data: newDevice,
        message: 'Device created successfully'
      });
    } catch (error) {
      console.error('Error creating device:', error);
      if (error.code === '23505') { // Unique violation
        res.status(400).json({
          success: false,
          error: 'Device ID already exists'
        });
      } else if (error.code === '23503') { // Foreign key violation
        res.status(400).json({
          success: false,
          error: 'Referenced trash bin does not exist'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to create device',
          message: error.message
        });
      }
    }
  }

  // Update device
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedDevice = await DeviceModel.update(id, updateData);

      if (!updatedDevice) {
        return res.status(404).json({
          success: false,
          error: 'Device not found'
        });
      }

      res.json({
        success: true,
        data: updatedDevice,
        message: 'Device updated successfully'
      });
    } catch (error) {
      console.error('Error updating device:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update device',
        message: error.message
      });
    }
  }

  // Delete device
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const deletedDevice = await DeviceModel.delete(id);

      if (!deletedDevice) {
        return res.status(404).json({
          success: false,
          error: 'Device not found'
        });
      }

      res.json({
        success: true,
        data: deletedDevice,
        message: 'Device deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting device:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete device',
        message: error.message
      });
    }
  }

  // =====================================================
  // 🔋 BATTERY RESET ENDPOINTS
  // =====================================================

  /**
   * Reset battery to 94% for a single device or all devices
   * POST /api/devices/battery/reset (reset all devices)
   * POST /api/devices/:deviceId/battery/reset (reset specific device)
   */
  static async resetBattery(req, res) {
    try {
      const { deviceId } = req.params;
      const RESET_BATTERY_PERCENTAGE = 94.0;

      let results = [];

      if (deviceId) {
        // Reset single device
        console.log(`🔋 Resetting battery for device: ${deviceId}`);

        // Check if device exists
        const device = await prisma.device.findUnique({
          where: { deviceid: deviceId }
        });

        if (!device) {
          return res.status(404).json({
            success: false,
            error: 'Device not found',
            message: `Device with ID ${deviceId} does not exist`
          });
        }

        // Get current battery
        const currentHealth = await prisma.deviceHealth.findFirst({
          where: { deviceid: deviceId },
          orderBy: { timestamp: 'desc' }
        });

        // Create new battery record at 94%
        const healthId = `DH-${deviceId}-RESET-${Date.now()}`;
        const newHealth = await prisma.deviceHealth.create({
          data: {
            healthid: healthId,
            deviceid: deviceId,
            battery_percentage: RESET_BATTERY_PERCENTAGE,
            error_count_24h: currentHealth?.error_count_24h ?? 0,
            timestamp: new Date()
          }
        });

        results.push({
          deviceId: deviceId,
          previousBattery: currentHealth?.battery_percentage ?? null,
          newBattery: RESET_BATTERY_PERCENTAGE,
          timestamp: newHealth.timestamp
        });

        console.log(`✅ Battery reset for ${deviceId}: ${currentHealth?.battery_percentage ?? 'N/A'}% → 94%`);

      } else {
        // Reset all devices
        console.log('🔋 Resetting battery for ALL devices...');

        // Get all devices
        const allDevices = await prisma.device.findMany({
          select: { deviceid: true }
        });

        console.log(`Found ${allDevices.length} devices to reset`);

        // Reset each device
        for (const device of allDevices) {
          const deviceId = device.deviceid;

          // Get current battery
          const currentHealth = await prisma.deviceHealth.findFirst({
            where: { deviceid: deviceId },
            orderBy: { timestamp: 'desc' }
          });

          // Create new battery record at 94%
          const healthId = `DH-${deviceId}-RESET-${Date.now()}`;
          const newHealth = await prisma.deviceHealth.create({
            data: {
              healthid: healthId,
              deviceid: deviceId,
              battery_percentage: RESET_BATTERY_PERCENTAGE,
              error_count_24h: currentHealth?.error_count_24h ?? 0,
              timestamp: new Date()
            }
          });

          results.push({
            deviceId: deviceId,
            previousBattery: currentHealth?.battery_percentage ?? null,
            newBattery: RESET_BATTERY_PERCENTAGE,
            timestamp: newHealth.timestamp
          });

          console.log(`✅ Battery reset for ${deviceId}: ${currentHealth?.battery_percentage ?? 'N/A'}% → 94%`);
        }
      }

      res.json({
        success: true,
        message: deviceId
          ? `Battery reset successfully for device ${deviceId}`
          : `Battery reset successfully for ${results.length} devices`,
        data: {
          resetBatteryPercentage: RESET_BATTERY_PERCENTAGE,
          devicesReset: results.length,
          details: results
        }
      });

    } catch (error) {
      console.error('❌ Error resetting battery:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reset battery',
        message: error.message
      });
    }
  }

  /**
   * Get battery status for all devices
   * GET /api/devices/battery/status
   */
  static async getBatteryStatus(req, res) {
    try {
      // Get all devices with their latest battery status
      const devices = await prisma.device.findMany({
        select: {
          deviceid: true,
          category: true,
          trashbinid: true,
          status: true
        }
      });

      const batteryStatus = [];

      for (const device of devices) {
        const latestHealth = await prisma.deviceHealth.findFirst({
          where: { deviceid: device.deviceid },
          orderBy: { timestamp: 'desc' },
          select: {
            battery_percentage: true,
            timestamp: true,
            error_count_24h: true
          }
        });

        const battery = latestHealth?.battery_percentage ?? null;
        let healthStatus = 'unknown';

        if (battery !== null) {
          if (battery === 0) healthStatus = 'dead';
          else if (battery < 20) healthStatus = 'critical';
          else if (battery < 40) healthStatus = 'low';
          else if (battery < 70) healthStatus = 'moderate';
          else healthStatus = 'healthy';
        }

        batteryStatus.push({
          deviceId: device.deviceid,
          category: device.category,
          trashbinId: device.trashbinid,
          deviceStatus: device.status,
          battery: {
            percentage: battery,
            healthStatus: healthStatus,
            lastUpdate: latestHealth?.timestamp ?? null,
            errorCount24h: latestHealth?.error_count_24h ?? 0
          }
        });
      }

      // Sort by battery percentage (lowest first)
      batteryStatus.sort((a, b) => {
        const battA = a.battery.percentage ?? 100;
        const battB = b.battery.percentage ?? 100;
        return battA - battB;
      });

      res.json({
        success: true,
        data: {
          totalDevices: batteryStatus.length,
          devices: batteryStatus,
          summary: {
            dead: batteryStatus.filter(d => d.battery.healthStatus === 'dead').length,
            critical: batteryStatus.filter(d => d.battery.healthStatus === 'critical').length,
            low: batteryStatus.filter(d => d.battery.healthStatus === 'low').length,
            moderate: batteryStatus.filter(d => d.battery.healthStatus === 'moderate').length,
            healthy: batteryStatus.filter(d => d.battery.healthStatus === 'healthy').length,
            unknown: batteryStatus.filter(d => d.battery.healthStatus === 'unknown').length
          }
        }
      });

    } catch (error) {
      console.error('❌ Error getting battery status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get battery status',
        message: error.message
      });
    }
  }
}

module.exports = DeviceController;