-- Add indexes to optimize 5-minute interval queries
-- These indexes will significantly speed up the queries

-- Index on weightdata timestamp for faster time-range filtering
CREATE INDEX IF NOT EXISTS idx_weightdata_timestamp
ON weightdata(timestamp DESC);

-- Index on weightdata sensorid for faster joins
CREATE INDEX IF NOT EXISTS idx_weightdata_sensorid
ON weightdata(sensorid);

-- Index on sensor deviceid for faster joins
CREATE INDEX IF NOT EXISTS idx_sensor_deviceid
ON sensor(deviceid);

-- Index on device trashbinid for bin-specific queries
CREATE INDEX IF NOT EXISTS idx_device_trashbinid
ON device(trashbinid);

-- Composite index for device queries
CREATE INDEX IF NOT EXISTS idx_device_trashbin_category
ON device(trashbinid, category);

-- Index on volumedata timestamp for faster time-range filtering
CREATE INDEX IF NOT EXISTS idx_volumedata_timestamp
ON volumedata(timestamp DESC);

-- Index on volumedata sensorid for faster joins
CREATE INDEX IF NOT EXISTS idx_volumedata_sensorid
ON volumedata(sensorid);

-- Analyze tables to update statistics
ANALYZE weightdata;
ANALYZE volumedata;
ANALYZE sensor;
ANALYZE device;

-- Show created indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('weightdata', 'volumedata', 'sensor', 'device')
ORDER BY tablename, indexname;
