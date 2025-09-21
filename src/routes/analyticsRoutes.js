const express = require('express');
const AnalyticsController = require('../controllers/analyticsController');

const router = express.Router();

// GET /api/analytics/dashboard - Get dashboard overview statistics
router.get('/dashboard', AnalyticsController.getDashboardOverview);

// GET /api/analytics/waste-distribution - Get waste category distribution
router.get('/waste-distribution', AnalyticsController.getWasteCategoryDistribution);

// GET /api/analytics/hourly-patterns - Get hourly waste patterns
router.get('/hourly-patterns', AnalyticsController.getHourlyWastePatterns);

// GET /api/analytics/daily - Get daily analytics for charts
router.get('/daily', AnalyticsController.getDailyAnalytics);

// GET /api/analytics/fill-levels - Get fill level distribution
router.get('/fill-levels', AnalyticsController.getFillLevelDistribution);

// GET /api/analytics/locations - Get location-based analytics
router.get('/locations', AnalyticsController.getLocationAnalytics);

// GET /api/analytics/devices/:deviceId/realtime - Get real-time data for specific device
router.get('/devices/:deviceId/realtime', AnalyticsController.getRealTimeData);

// GET /api/analytics/collection-trends - Get collection frequency trends
router.get('/collection-trends', AnalyticsController.getCollectionTrends);

// GET /api/analytics/health-trends - Get device health trends
router.get('/health-trends', AnalyticsController.getDeviceHealthTrends);

// GET /api/analytics/alert-statistics - Get alert statistics
router.get('/alert-statistics', AnalyticsController.getAlertStatistics);

// TB001 specific routes
// GET /api/analytics/tb001/volume - Get TB001 volume data
router.get('/tb001/volume', AnalyticsController.getTB001VolumeData);

// GET /api/analytics/tb001/weight - Get TB001 weight data
router.get('/tb001/weight', AnalyticsController.getTB001WeightData);

// GET /api/analytics/tb001/battery - Get TB001 battery data
router.get('/tb001/battery', AnalyticsController.getTB001BatteryData);

// GET /api/analytics/tb001/combined - Get TB001 combined data
router.get('/tb001/combined', AnalyticsController.getTB001CombinedData);

module.exports = router;