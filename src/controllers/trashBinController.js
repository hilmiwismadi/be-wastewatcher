const TrashBinModel = require('../models/trashBinModel');

class TrashBinController {
  // Get all trash bins
  static async getAll(req, res) {
    try {
      const trashBins = await TrashBinModel.getAll();
      res.json({
        success: true,
        data: trashBins,
        count: trashBins.length
      });
    } catch (error) {
      console.error('Error fetching trash bins:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch trash bins',
        message: error.message
      });
    }
  }

  // Get trash bin by ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const trashBin = await TrashBinModel.getById(id);

      if (!trashBin) {
        return res.status(404).json({
          success: false,
          error: 'Trash bin not found'
        });
      }

      res.json({
        success: true,
        data: trashBin
      });
    } catch (error) {
      console.error('Error fetching trash bin:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch trash bin',
        message: error.message
      });
    }
  }

  // Get all trash bins with current status
  static async getAllWithStatus(req, res) {
    try {
      const trashBins = await TrashBinModel.getAllWithStatus();
      res.json({
        success: true,
        data: trashBins,
        count: trashBins.length
      });
    } catch (error) {
      console.error('Error fetching trash bins with status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch trash bins with status',
        message: error.message
      });
    }
  }

  // Get trash bins by location
  static async getByLocation(req, res) {
    try {
      const { area } = req.params;
      const trashBins = await TrashBinModel.getByLocation(area);

      res.json({
        success: true,
        data: trashBins,
        count: trashBins.length,
        area: area
      });
    } catch (error) {
      console.error('Error fetching trash bins by location:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch trash bins by location',
        message: error.message
      });
    }
  }

  // Create new trash bin
  static async create(req, res) {
    try {
      const trashBinData = req.body;
      const newTrashBin = await TrashBinModel.create(trashBinData);

      res.status(201).json({
        success: true,
        data: newTrashBin,
        message: 'Trash bin created successfully'
      });
    } catch (error) {
      console.error('Error creating trash bin:', error);
      if (error.code === '23505') { // Unique violation
        res.status(400).json({
          success: false,
          error: 'Trash bin ID already exists'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to create trash bin',
          message: error.message
        });
      }
    }
  }

  // Update trash bin
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedTrashBin = await TrashBinModel.update(id, updateData);

      if (!updatedTrashBin) {
        return res.status(404).json({
          success: false,
          error: 'Trash bin not found'
        });
      }

      res.json({
        success: true,
        data: updatedTrashBin,
        message: 'Trash bin updated successfully'
      });
    } catch (error) {
      console.error('Error updating trash bin:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update trash bin',
        message: error.message
      });
    }
  }

  // Delete trash bin
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const deletedTrashBin = await TrashBinModel.delete(id);

      if (!deletedTrashBin) {
        return res.status(404).json({
          success: false,
          error: 'Trash bin not found'
        });
      }

      res.json({
        success: true,
        data: deletedTrashBin,
        message: 'Trash bin deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting trash bin:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete trash bin',
        message: error.message
      });
    }
  }
}

module.exports = TrashBinController;