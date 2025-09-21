const express = require('express');
const TrashBinController = require('../controllers/trashBinController');

const router = express.Router();

// GET /api/trash-bins - Get all trash bins
router.get('/', TrashBinController.getAll);

// GET /api/trash-bins/status - Get all trash bins with current status
router.get('/status', TrashBinController.getAllWithStatus);

// GET /api/trash-bins/location/:area - Get trash bins by location/area
router.get('/location/:area', TrashBinController.getByLocation);

// GET /api/trash-bins/:id - Get specific trash bin
router.get('/:id', TrashBinController.getById);

// POST /api/trash-bins - Create new trash bin
router.post('/', TrashBinController.create);

// PUT /api/trash-bins/:id - Update trash bin
router.put('/:id', TrashBinController.update);

// DELETE /api/trash-bins/:id - Delete trash bin
router.delete('/:id', TrashBinController.delete);

module.exports = router;