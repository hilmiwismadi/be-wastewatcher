-- Add indexes to improve query performance for analytics
-- Run this with: psql $DATABASE_URL -f scripts/add_indexes.sql

-- Index on weightdata timestamp for time-based queries
CREATE INDEX IF NOT EXISTS idx_weightdata_timestamp ON weightdata(timestamp);

-- Index on weightdata sensorid for joins
CREATE INDEX IF NOT EXISTS idx_weightdata_sensorid ON weightdata(sensorid);

-- Index on volumedata timestamp for time-based queries
CREATE INDEX IF NOT EXISTS idx_volumedata_timestamp ON volumedata(timestamp);

-- Index on volumedata sensorid for joins
CREATE INDEX IF NOT EXISTS idx_volumedata_sensorid ON volumedata(sensorid);

-- Index on sensor deviceid for joins
CREATE INDEX IF NOT EXISTS idx_sensor_deviceid ON sensor(deviceid);

-- Index on device trashbinid for filtering by bin
CREATE INDEX IF NOT EXISTS idx_device_trashbinid ON device(trashbinid);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_weightdata_timestamp_sensorid ON weightdata(timestamp, sensorid);
CREATE INDEX IF NOT EXISTS idx_volumedata_timestamp_sensorid ON volumedata(timestamp, sensorid);

-- Index on dailyanalytics for faster aggregation queries
CREATE INDEX IF NOT EXISTS idx_dailyanalytics_date ON dailyanalytics(analysis_date);
CREATE INDEX IF NOT EXISTS idx_dailyanalytics_deviceid ON dailyanalytics(deviceid);

-- Analyze tables to update statistics
ANALYZE weightdata;
ANALYZE volumedata;
ANALYZE sensor;
ANALYZE device;
ANALYZE dailyanalytics;

-- Show the created indexes
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('weightdata', 'volumedata', 'sensor', 'device', 'dailyanalytics')
ORDER BY tablename, indexname;
