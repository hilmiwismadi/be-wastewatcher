-- Initialize Battery System Migration
-- This migration sets up the battery management system for all devices
-- Starting battery: 94%
-- Reduction rate: 0.014% per MQTT message

-- Step 1: Update all existing devicehealth records to 94% battery
UPDATE devicehealth
SET battery_percentage = 94.0
WHERE battery_percentage IS NULL OR battery_percentage != 94.0;

-- Step 2: Set default battery percentage for new records
ALTER TABLE devicehealth
ALTER COLUMN battery_percentage SET DEFAULT 94.0;

-- Step 3: Ensure battery_percentage is not null for better data integrity
-- (Optional - comment out if you want to keep it nullable)
-- ALTER TABLE devicehealth
-- ALTER COLUMN battery_percentage SET NOT NULL;

-- Step 4: Create or update index for efficient battery queries (if not exists)
CREATE INDEX IF NOT EXISTS idx_devicehealth_battery_timestamp
ON devicehealth(deviceid, battery_percentage, timestamp DESC);

-- Step 5: Add comment to document the battery system
COMMENT ON COLUMN devicehealth.battery_percentage IS
'Battery percentage (0-100). Starts at 94%, reduces by 0.014% per MQTT transmission. Reset via API endpoint.';

-- Verification query (run manually to verify)
-- SELECT deviceid, battery_percentage, timestamp
-- FROM devicehealth
-- WHERE timestamp = (SELECT MAX(timestamp) FROM devicehealth dh2 WHERE dh2.deviceid = devicehealth.deviceid)
-- ORDER BY deviceid;
