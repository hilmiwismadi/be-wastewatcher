const express = require('express');
const DeviceController = require('../controllers/deviceController');

const router = express.Router();

// GET /api/devices - Get all devices
router.get('/', DeviceController.getAll);

// GET /api/devices/health - Get devices with health status
router.get('/health', DeviceController.getWithHealthStatus);

// GET /api/devices/statistics - Get device statistics
router.get('/statistics', DeviceController.getStatistics);

// GET /api/devices/category/:category - Get devices by category
router.get('/category/:category', DeviceController.getByCategory);

// GET /api/devices/:id - Get specific device
router.get('/:id', DeviceController.getById);

// GET /api/devices/:id/status - Get current status of specific device
router.get('/:id/status', DeviceController.getCurrentStatus);

// POST /api/devices - Create new device
router.post('/', DeviceController.create);

// PUT /api/devices/:id - Update device
router.put('/:id', DeviceController.update);

// DELETE /api/devices/:id - Delete device
router.delete('/:id', DeviceController.delete);

module.exports = router;