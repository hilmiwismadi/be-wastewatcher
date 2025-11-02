-- CreateTable
CREATE TABLE "TrashBin" (
    "trashbinId" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "location" VARCHAR NOT NULL,
    "area" VARCHAR,
    "floor" VARCHAR,
    "capacity_liters" DOUBLE PRECISION,
    "installation_date" DATE,
    "status" VARCHAR NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrashBin_pkey" PRIMARY KEY ("trashbinId")
);

-- CreateTable
CREATE TABLE "Device" (
    "deviceId" VARCHAR NOT NULL,
    "trashbinId" VARCHAR NOT NULL,
    "category" VARCHAR NOT NULL,
    "installation_date" DATE,
    "last_maintenance_date" DATE,
    "status" VARCHAR NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("deviceId")
);

-- CreateTable
CREATE TABLE "Sensor" (
    "sensorId" VARCHAR NOT NULL,
    "deviceId" VARCHAR NOT NULL,
    "sensor_type" VARCHAR NOT NULL,
    "sensor_position" VARCHAR,
    "model_number" VARCHAR,
    "calibration_factor" DOUBLE PRECISION DEFAULT 1.0,
    "last_calibrated_date" DATE,
    "status" VARCHAR NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sensor_pkey" PRIMARY KEY ("sensorId")
);

-- CreateTable
CREATE TABLE "WeightData" (
    "weightDataId" VARCHAR NOT NULL,
    "sensorId" VARCHAR NOT NULL,
    "weight_kg" DOUBLE PRECISION NOT NULL,
    "raw_reading" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeightData_pkey" PRIMARY KEY ("weightDataId")
);

-- CreateTable
CREATE TABLE "VolumeData" (
    "volumeDataId" VARCHAR NOT NULL,
    "sensorId" VARCHAR NOT NULL,
    "distance_cm" DOUBLE PRECISION NOT NULL,
    "fill_percentage" DOUBLE PRECISION NOT NULL,
    "raw_reading" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VolumeData_pkey" PRIMARY KEY ("volumeDataId")
);

-- CreateTable
CREATE TABLE "BinStatus" (
    "binStatusId" VARCHAR NOT NULL,
    "deviceId" VARCHAR NOT NULL,
    "total_weight_kg" DOUBLE PRECISION,
    "average_volume_percentage" DOUBLE PRECISION,
    "status" VARCHAR NOT NULL,
    "condition" VARCHAR,
    "last_updated" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calculation_method" VARCHAR DEFAULT 'average',
    "sensor_contributions" JSONB,

    CONSTRAINT "BinStatus_pkey" PRIMARY KEY ("binStatusId")
);

-- CreateTable
CREATE TABLE "BinStatusHistory" (
    "historyId" VARCHAR NOT NULL,
    "deviceId" VARCHAR NOT NULL,
    "total_weight_kg" DOUBLE PRECISION,
    "average_volume_percentage" DOUBLE PRECISION,
    "status" VARCHAR NOT NULL,
    "condition" VARCHAR,
    "recorded_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trigger_reason" VARCHAR,

    CONSTRAINT "BinStatusHistory_pkey" PRIMARY KEY ("historyId")
);

-- CreateTable
CREATE TABLE "DeviceHealth" (
    "healthId" VARCHAR NOT NULL,
    "deviceId" VARCHAR NOT NULL,
    "battery_percentage" DOUBLE PRECISION,
    "error_count_24h" INTEGER DEFAULT 0,
    "error_details" JSONB,
    "timestamp" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceHealth_pkey" PRIMARY KEY ("healthId")
);

-- CreateTable
CREATE TABLE "DailyAnalytics" (
    "analyticsId" VARCHAR NOT NULL,
    "deviceId" VARCHAR NOT NULL,
    "analysis_date" DATE NOT NULL,
    "avg_weight" DOUBLE PRECISION,
    "max_weight" DOUBLE PRECISION,
    "avg_volume" DOUBLE PRECISION,
    "max_volume" DOUBLE PRECISION,
    "collection_frequency" INTEGER,
    "waste_density" DOUBLE PRECISION,
    "hourly_patterns" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyAnalytics_pkey" PRIMARY KEY ("analyticsId")
);

-- CreateTable
CREATE TABLE "AlertLog" (
    "alertId" VARCHAR NOT NULL,
    "deviceId" VARCHAR,
    "sensorId" VARCHAR,
    "alert_type" VARCHAR NOT NULL,
    "message" TEXT NOT NULL,
    "alert_data" JSONB,
    "triggered_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(6),
    "resolution_notes" TEXT,

    CONSTRAINT "AlertLog_pkey" PRIMARY KEY ("alertId")
);

-- CreateTable
CREATE TABLE "User" (
    "userId" VARCHAR NOT NULL,
    "username" VARCHAR NOT NULL,
    "password_hash" VARCHAR NOT NULL,
    "email" VARCHAR,
    "role" VARCHAR NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login" TIMESTAMP(6),
    "status" VARCHAR NOT NULL DEFAULT 'active',

    CONSTRAINT "User_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "sessionId" VARCHAR NOT NULL,
    "userId" VARCHAR NOT NULL,
    "login_time" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" VARCHAR,
    "user_agent" TEXT,
    "status" VARCHAR NOT NULL DEFAULT 'active',

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("sessionId")
);

-- CreateTable
CREATE TABLE "SensorType" (
    "typeId" VARCHAR NOT NULL,
    "type_name" VARCHAR NOT NULL,
    "description" TEXT,
    "default_settings" JSONB,
    "validation_rules" JSONB,
    "min_value" DOUBLE PRECISION,
    "max_value" DOUBLE PRECISION,
    "unit" VARCHAR,

    CONSTRAINT "SensorType_pkey" PRIMARY KEY ("typeId")
);

-- CreateTable
CREATE TABLE "WasteCategory" (
    "categoryId" VARCHAR NOT NULL,
    "category_name" VARCHAR NOT NULL,
    "description" TEXT,
    "color_code" VARCHAR,
    "processing_rules" JSONB,
    "density_factor" DOUBLE PRECISION DEFAULT 1.0,

    CONSTRAINT "WasteCategory_pkey" PRIMARY KEY ("categoryId")
);

-- CreateIndex
CREATE INDEX "idx_weight_sensor" ON "WeightData"("sensorId");

-- CreateIndex
CREATE INDEX "idx_weight_timestamp" ON "WeightData"("timestamp");

-- CreateIndex
CREATE INDEX "idx_weight_sensor_time" ON "WeightData"("sensorId", "timestamp");

-- CreateIndex
CREATE INDEX "idx_volume_sensor" ON "VolumeData"("sensorId");

-- CreateIndex
CREATE INDEX "idx_volume_timestamp" ON "VolumeData"("timestamp");

-- CreateIndex
CREATE INDEX "idx_volume_sensor_time" ON "VolumeData"("sensorId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "BinStatus_deviceId_key" ON "BinStatus"("deviceId");

-- CreateIndex
CREATE INDEX "idx_binstatus_device" ON "BinStatus"("deviceId");

-- CreateIndex
CREATE INDEX "idx_binstatus_updated" ON "BinStatus"("last_updated");

-- CreateIndex
CREATE INDEX "idx_binstatus_status" ON "BinStatus"("status");

-- CreateIndex
CREATE INDEX "idx_history_device" ON "BinStatusHistory"("deviceId");

-- CreateIndex
CREATE INDEX "idx_history_time" ON "BinStatusHistory"("recorded_at");

-- CreateIndex
CREATE INDEX "idx_history_device_time" ON "BinStatusHistory"("deviceId", "recorded_at");

-- CreateIndex
CREATE INDEX "idx_health_device" ON "DeviceHealth"("deviceId");

-- CreateIndex
CREATE INDEX "idx_health_timestamp" ON "DeviceHealth"("timestamp");

-- CreateIndex
CREATE INDEX "idx_health_battery" ON "DeviceHealth"("battery_percentage");

-- CreateIndex
CREATE INDEX "idx_analytics_device" ON "DailyAnalytics"("deviceId");

-- CreateIndex
CREATE INDEX "idx_analytics_date" ON "DailyAnalytics"("analysis_date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyAnalytics_deviceId_analysis_date_key" ON "DailyAnalytics"("deviceId", "analysis_date");

-- CreateIndex
CREATE INDEX "idx_alert_device" ON "AlertLog"("deviceId");

-- CreateIndex
CREATE INDEX "idx_alert_type" ON "AlertLog"("alert_type");

-- CreateIndex
CREATE INDEX "idx_alert_triggered" ON "AlertLog"("triggered_at");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "idx_user_username" ON "User"("username");

-- CreateIndex
CREATE INDEX "idx_user_email" ON "User"("email");

-- CreateIndex
CREATE INDEX "idx_user_role" ON "User"("role");

-- CreateIndex
CREATE INDEX "idx_session_user" ON "UserSession"("userId");

-- CreateIndex
CREATE INDEX "idx_session_login" ON "UserSession"("login_time");

-- CreateIndex
CREATE INDEX "idx_session_status" ON "UserSession"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SensorType_type_name_key" ON "SensorType"("type_name");

-- CreateIndex
CREATE UNIQUE INDEX "WasteCategory_category_name_key" ON "WasteCategory"("category_name");

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_trashbinId_fkey" FOREIGN KEY ("trashbinId") REFERENCES "TrashBin"("trashbinId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sensor" ADD CONSTRAINT "Sensor_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("deviceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeightData" ADD CONSTRAINT "WeightData_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Sensor"("sensorId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolumeData" ADD CONSTRAINT "VolumeData_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Sensor"("sensorId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BinStatus" ADD CONSTRAINT "BinStatus_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("deviceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BinStatusHistory" ADD CONSTRAINT "BinStatusHistory_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("deviceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceHealth" ADD CONSTRAINT "DeviceHealth_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("deviceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyAnalytics" ADD CONSTRAINT "DailyAnalytics_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("deviceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertLog" ADD CONSTRAINT "AlertLog_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("deviceId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertLog" ADD CONSTRAINT "AlertLog_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Sensor"("sensorId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

