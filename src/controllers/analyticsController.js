const AnalyticsModel = require('../models/analyticsModel');

class AnalyticsController {
  // Get dashboard overview
  static async getDashboardOverview(req, res) {
    try {
      const overview = await AnalyticsModel.getDashboardOverview();
      res.json({
        success: true,
        data: overview
      });
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard overview',
        message: error.message
      });
    }
  }

  // Get waste category distribution
  static async getWasteCategoryDistribution(req, res) {
    try {
      const distribution = await AnalyticsModel.getWasteCategoryDistribution();
      res.json({
        success: true,
        data: distribution
      });
    } catch (error) {
      console.error('Error fetching waste category distribution:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch waste category distribution',
        message: error.message
      });
    }
  }

  // Get hourly waste patterns
  static async getHourlyWastePatterns(req, res) {
    try {
      const { deviceId, category } = req.query;
      const patterns = await AnalyticsModel.getHourlyWastePatterns(deviceId, category);

      res.json({
        success: true,
        data: patterns,
        filters: { deviceId, category }
      });
    } catch (error) {
      console.error('Error fetching hourly waste patterns:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch hourly waste patterns',
        message: error.message
      });
    }
  }

  // Get 5-minute interval data (for hourly view)
  static async getFiveMinuteIntervalData(req, res) {
    try {
      const { deviceId, category, startDate, endDate, trashbinid } = req.query;
      const data = await AnalyticsModel.getFiveMinuteIntervalData(deviceId, category, startDate, endDate, trashbinid);

      res.json({
        success: true,
        data: data,
        count: data.length,
        interval: '5 minutes',
        filters: { deviceId, category, startDate, endDate, trashbinid }
      });
    } catch (error) {
      console.error('Error fetching 5-minute interval data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch 5-minute interval data',
        message: error.message
      });
    }
  }

  // Get hourly interval data (for daily view)
  static async getHourlyIntervalData(req, res) {
    try {
      const { deviceId, category, startDate, endDate, trashbinid } = req.query;
      const data = await AnalyticsModel.getHourlyIntervalData(deviceId, category, startDate, endDate, trashbinid);

      res.json({
        success: true,
        data: data,
        count: data.length,
        interval: 'hourly',
        filters: { deviceId, category, startDate, endDate, trashbinid }
      });
    } catch (error) {
      console.error('Error fetching hourly interval data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch hourly interval data',
        message: error.message
      });
    }
  }

  // Get daily analytics for charts
  static async getDailyAnalytics(req, res) {
    try {
      const { days = 30, category, startDate, endDate, deviceId, trashbinid } = req.query;

      let periodDescription = `${days} days`;
      if (startDate && endDate) {
        periodDescription = `${startDate} to ${endDate}`;
      }

      const analytics = await AnalyticsModel.getDailyAnalytics(
        parseInt(days),
        category,
        startDate,
        endDate,
        deviceId,
        trashbinid
      );

      res.json({
        success: true,
        data: analytics,
        period: periodDescription,
        category: category || 'all',
        dateRange: startDate && endDate ? { startDate, endDate } : null
      });
    } catch (error) {
      console.error('Error fetching daily analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch daily analytics',
        message: error.message
      });
    }
  }

  // Get fill level distribution
  static async getFillLevelDistribution(req, res) {
    try {
      const distribution = await AnalyticsModel.getFillLevelDistribution();
      res.json({
        success: true,
        data: distribution
      });
    } catch (error) {
      console.error('Error fetching fill level distribution:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch fill level distribution',
        message: error.message
      });
    }
  }

  // Get location-based analytics
  static async getLocationAnalytics(req, res) {
    try {
      const analytics = await AnalyticsModel.getLocationAnalytics();
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error fetching location analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch location analytics',
        message: error.message
      });
    }
  }

  // Get real-time data for specific device
  static async getRealTimeData(req, res) {
    try {
      const { deviceId } = req.params;
      const { hours = 24 } = req.query;

      const data = await AnalyticsModel.getRealTimeData(deviceId, parseInt(hours));

      res.json({
        success: true,
        data: data,
        deviceId,
        period: `${hours} hours`
      });
    } catch (error) {
      console.error('Error fetching real-time data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch real-time data',
        message: error.message
      });
    }
  }

  // Get collection trends
  static async getCollectionTrends(req, res) {
    try {
      const { days = 30 } = req.query;
      const trends = await AnalyticsModel.getCollectionTrends(parseInt(days));

      res.json({
        success: true,
        data: trends,
        period: `${days} days`
      });
    } catch (error) {
      console.error('Error fetching collection trends:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch collection trends',
        message: error.message
      });
    }
  }

  // Get device health trends
  static async getDeviceHealthTrends(req, res) {
    try {
      const { days = 7 } = req.query;
      const trends = await AnalyticsModel.getDeviceHealthTrends(parseInt(days));

      res.json({
        success: true,
        data: trends,
        period: `${days} days`
      });
    } catch (error) {
      console.error('Error fetching device health trends:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch device health trends',
        message: error.message
      });
    }
  }

  // Get alert statistics
  static async getAlertStatistics(req, res) {
    try {
      const { days = 30 } = req.query;
      const stats = await AnalyticsModel.getAlertStatistics(parseInt(days));

      res.json({
        success: true,
        data: stats,
        period: `${days} days`
      });
    } catch (error) {
      console.error('Error fetching alert statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch alert statistics',
        message: error.message
      });
    }
  }

  // Get TB001 Volume Data
  static async getTB001VolumeData(req, res) {
    try {
      const data = await AnalyticsModel.getTB001VolumeData();
      res.json({
        success: true,
        data: data,
        count: data.length,
        message: 'TB001 volume data retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching TB001 volume data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch TB001 volume data',
        message: error.message
      });
    }
  }

  // Get TB001 Weight Data
  static async getTB001WeightData(req, res) {
    try {
      const data = await AnalyticsModel.getTB001WeightData();
      res.json({
        success: true,
        data: data,
        count: data.length,
        message: 'TB001 weight data retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching TB001 weight data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch TB001 weight data',
        message: error.message
      });
    }
  }

  // Get TB001 Battery Data
  static async getTB001BatteryData(req, res) {
    try {
      const data = await AnalyticsModel.getTB001BatteryData();
      res.json({
        success: true,
        data: data,
        count: data.length,
        message: 'TB001 battery data retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching TB001 battery data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch TB001 battery data',
        message: error.message
      });
    }
  }

  // Get TB001 Combined Data
  static async getTB001CombinedData(req, res) {
    try {
      const data = await AnalyticsModel.getTB001CombinedData();
      res.json({
        success: true,
        data: data,
        count: data.length,
        message: 'TB001 combined data retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching TB001 combined data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch TB001 combined data',
        message: error.message
      });
    }
  }

  // Get aggregated composition (weight and volume) for all bins
  static async getAggregatedComposition(req, res) {
    try {
      const data = await AnalyticsModel.getAggregatedComposition();
      res.json({
        success: true,
        data: data,
        message: 'Aggregated composition data retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching aggregated composition:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch aggregated composition',
        message: error.message
      });
    }
  }
}

module.exports = AnalyticsController;