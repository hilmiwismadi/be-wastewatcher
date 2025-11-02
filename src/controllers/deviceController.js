const DeviceModel = require('../models/deviceModel');

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
}

module.exports = DeviceController;