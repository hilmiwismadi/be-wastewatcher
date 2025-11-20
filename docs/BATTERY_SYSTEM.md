# Battery Management System Documentation

## Overview

The Battery Management System tracks and manages battery levels for all IoT devices in the WasteWatcher system. Each device's battery decreases by **0.014%** with every MQTT data transmission, starting from **94%**.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Battery Reduction Algorithm](#battery-reduction-algorithm)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [MQTT Integration](#mqtt-integration)
6. [Frontend Integration](#frontend-integration)
7. [Deployment Guide](#deployment-guide)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## System Architecture

### Components

```
┌─────────────────┐
│   ESP32 Device  │
│  (MQTT Client)  │
└────────┬────────┘
         │ Publishes sensor data
         ├── Topic: CapsE6/Lt2SGLC
         └── Topic: CapsE6/KantinSGLC
         │
         ▼
┌─────────────────────────┐
│  MQTT Broker (HiveMQ)   │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│   Backend (Node.js)     │
│   - MQTTService         │◄── Receives MQTT messages
│   - Updates battery     │◄── Reduces by 0.014% per message
│   - Saves to database   │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  PostgreSQL Database    │
│  - devicehealth table   │◄── Stores battery history
│  - device table         │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  REST API Endpoints     │
│  - GET /battery/status  │
│  - POST /battery/reset  │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│   Frontend (Next.js)    │
│   - Battery display     │
│   - Admin reset panel   │
└─────────────────────────┘
```

---

## Battery Reduction Algorithm

### Configuration

| Parameter | Value | Description |
|-----------|-------|-------------|
| **Starting Battery** | 94.0% | Initial battery percentage for all devices |
| **Reduction Rate** | 0.014% | Amount reduced per MQTT transmission |
| **Battery Floor** | 0.0% | Minimum battery (cannot go negative) |
| **Messages to Depletion** | 6,714 | Approximate messages needed to reach 0% from 94% |

### Formula

```javascript
newBattery = currentBattery - 0.014%
newBattery = Math.max(newBattery, 0.0) // Apply floor
```

### Example Calculations

| Messages Sent | Battery Percentage | Calculation |
|---------------|-------------------|-------------|
| 0 | 94.000% | Initial state |
| 1 | 93.986% | 94.000 - 0.014 |
| 10 | 93.860% | 94.000 - (10 × 0.014) |
| 100 | 92.600% | 94.000 - (100 × 0.014) |
| 1,000 | 80.000% | 94.000 - (1,000 × 0.014) |
| 6,714 | 0.000% | Floor reached |
| 6,715+ | 0.000% | Remains at floor |

---

## Database Schema

### devicehealth Table

```sql
CREATE TABLE devicehealth (
  healthid           VARCHAR(50) PRIMARY KEY,
  deviceid           VARCHAR(50) NOT NULL,
  battery_percentage FLOAT DEFAULT 94.0,  -- Battery %
  error_count_24h    INT DEFAULT 0,
  error_details      JSONB,
  timestamp          TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (deviceid) REFERENCES device(deviceid) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_health_device ON devicehealth(deviceid);
CREATE INDEX idx_health_timestamp ON devicehealth(timestamp DESC);
CREATE INDEX idx_health_battery ON devicehealth(battery_percentage);
CREATE INDEX idx_devicehealth_battery_timestamp ON devicehealth(deviceid, battery_percentage, timestamp DESC);
```

### Battery Record Format

Each MQTT transmission creates a new `devicehealth` record:

```javascript
{
  healthid: "DH-DEV-LT2-ORG-1705752800000",
  deviceid: "DEV-LT2-ORG",
  battery_percentage: 93.986,
  error_count_24h: 0,
  error_details: null,
  timestamp: "2025-01-20T10:30:00.000Z"
}
```

---

## API Endpoints

### 1. Get Battery Status (All Devices)

```http
GET /api/devices/battery/status
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalDevices": 24,
    "devices": [
      {
        "deviceId": "DEV-LT2-ORG",
        "category": "Organic",
        "trashbinId": "TB-LT2",
        "deviceStatus": "active",
        "battery": {
          "percentage": 45.2,
          "healthStatus": "moderate",
          "lastUpdate": "2025-01-20T10:30:00.000Z",
          "errorCount24h": 0
        }
      }
    ],
    "summary": {
      "dead": 0,
      "critical": 2,
      "low": 5,
      "moderate": 10,
      "healthy": 7,
      "unknown": 0
    }
  }
}
```

**Health Status Thresholds:**

| Status | Battery Range | Action Required |
|--------|---------------|-----------------|
| **healthy** | 70% - 100% | ✅ No action needed |
| **moderate** | 40% - 69% | ⚠️ Monitor |
| **low** | 20% - 39% | ⚠️ Schedule maintenance |
| **critical** | 1% - 19% | 🚨 Urgent replacement needed |
| **dead** | 0% | 🔴 Device non-functional |
| **unknown** | null | ❓ No battery data |

---

### 2. Reset Battery (All Devices)

```http
POST /api/devices/battery/reset
```

**Response:**

```json
{
  "success": true,
  "message": "Battery reset successfully for 24 devices",
  "data": {
    "resetBatteryPercentage": 94.0,
    "devicesReset": 24,
    "details": [
      {
        "deviceId": "DEV-LT2-ORG",
        "previousBattery": 45.2,
        "newBattery": 94.0,
        "timestamp": "2025-01-20T11:00:00.000Z"
      }
    ]
  }
}
```

---

### 3. Reset Battery (Specific Device)

```http
POST /api/devices/:deviceId/battery/reset
```

**Example:**

```http
POST /api/devices/DEV-LT2-ORG/battery/reset
```

**Response:**

```json
{
  "success": true,
  "message": "Battery reset successfully for device DEV-LT2-ORG",
  "data": {
    "resetBatteryPercentage": 94.0,
    "devicesReset": 1,
    "details": [
      {
        "deviceId": "DEV-LT2-ORG",
        "previousBattery": 45.2,
        "newBattery": 94.0,
        "timestamp": "2025-01-20T11:00:00.000Z"
      }
    ]
  }
}
```

---

## MQTT Integration

### Device-to-Location Mapping

```javascript
// mqttService.js
locationToDeviceMapping = {
  'Lt2SGLC': {
    'organic': 'DEV-LT2-ORG',
    'anorganic': 'DEV-LT2-ANO',
    'residue': 'DEV-LT2-RES'
  },
  'KantinSGLC': {
    'organic': 'DEV-KANTIN-ORG',
    'anorganic': 'DEV-KANTIN-ANO',
    'residue': 'DEV-KANTIN-RES'
  }
};
```

### Battery Update Flow

1. **MQTT Message Received**
   ```
   Topic: CapsE6/Lt2SGLC
   Payload: {"DISTANCE":[60,59,75,73],"WEIGHT":892}
   ```

2. **Message Parsed**
   ```javascript
   {
     location: "Lt2SGLC",
     binType: "organic",
     deviceId: "DEV-LT2-ORG" // Mapped
   }
   ```

3. **Battery Updated**
   ```javascript
   currentBattery = 94.000%
   newBattery = 94.000 - 0.014 = 93.986%
   ```

4. **Database Record Created**
   ```sql
   INSERT INTO devicehealth (healthid, deviceid, battery_percentage, timestamp)
   VALUES ('DH-DEV-LT2-ORG-1705752800000', 'DEV-LT2-ORG', 93.986, NOW());
   ```

5. **Console Log**
   ```
   🔋 Battery updated for DEV-LT2-ORG: 94.000% → 93.986% (-0.014%)
   ```

---

## Frontend Integration

### API Service Method

Add to `fe-wastewatcher/src/services/api.ts`:

```typescript
async resetDeviceBattery(deviceId?: string): Promise<ApiResponse<any>> {
  const endpoint = deviceId
    ? `/devices/${deviceId}/battery/reset`
    : `/devices/battery/reset`;

  return this.post(endpoint, {});
}

async getBatteryStatus(): Promise<ApiResponse<any>> {
  return this.get('/devices/battery/status');
}
```

### Usage Example

```typescript
// Reset all devices
const response = await apiService.resetDeviceBattery();

// Reset specific device
const response = await apiService.resetDeviceBattery('DEV-LT2-ORG');

// Get battery status
const status = await apiService.getBatteryStatus();
```

---

## Deployment Guide

### Step 1: Run Database Migration

```bash
cd be-wastewatcher
npx prisma migrate deploy
```

Or manually run:

```bash
psql $DATABASE_URL < prisma/migrations/20250120000000_initialize_battery_system/migration.sql
```

### Step 2: Initialize Batteries

```bash
node scripts/seed_battery_initial.js
```

Expected output:

```
🔋 Initializing battery system...

Found 24 devices to initialize

✅ Initialized DEV-LT2-ORG (Organic) → 94%
✅ Initialized DEV-LT2-ANO (Anorganic) → 94%
...

🎉 Battery initialization complete!
✅ Successfully initialized: 24 devices
📊 Total devices: 24
```

### Step 3: Restart Backend Server

```bash
npm run dev  # or
npm start
```

### Step 4: Verify Battery System

```bash
# Check battery status via API
curl http://localhost:5000/api/devices/battery/status

# Or visit in browser
http://localhost:5000/api/devices/battery/status
```

---

## Testing

### Automated Test

Run the battery reduction test:

```bash
node scripts/test_battery_reduction.js
```

This will:
1. Send 100 MQTT messages
2. Verify battery reduced by exactly 1.4% (100 × 0.014%)
3. Test battery floor (0% minimum)

Expected output:

```
🧪 Battery Reduction Test
=============================================================
📊 Starting Battery: 94.000%
📤 Sending 100 MQTT messages...
  [10/100] Battery: 93.860%
  [20/100] Battery: 93.720%
  ...
✅ Sent 100 messages

=============================================================
📊 Test Results
=============================================================
Starting Battery:    94.000%
Ending Battery:      92.600%
Actual Reduction:    1.400%
Expected Reduction:  1.400%
Difference:          0.000%

✅ TEST PASSED! Battery reduction is working correctly.
=============================================================
```

### Manual Testing

1. **Send MQTT Message:**
   ```bash
   mosquitto_pub -h broker.hivemq.com -t "CapsE6/Lt2SGLC" \
     -m '{"DISTANCE":[60,59,75,73],"WEIGHT":892}'
   ```

2. **Check Battery:**
   ```bash
   curl http://localhost:5000/api/devices/battery/status | jq '.data.devices[] | select(.deviceId=="DEV-LT2-ORG")'
   ```

3. **Reset Battery:**
   ```bash
   curl -X POST http://localhost:5000/api/devices/DEV-LT2-ORG/battery/reset
   ```

---

## Troubleshooting

### Issue: Battery Not Decreasing

**Symptoms:**
- MQTT messages received
- Sensor data saved
- Battery percentage unchanged

**Solution:**

1. Check device mapping:
   ```javascript
   // mqttService.js
   console.log(this.locationToDeviceMapping);
   ```

2. Verify device exists in database:
   ```sql
   SELECT * FROM device WHERE deviceid = 'DEV-LT2-ORG';
   ```

3. Check MQTT service logs:
   ```
   🔋 Battery updated for DEV-LT2-ORG: ...
   ```

---

### Issue: Battery Goes Negative

**Symptoms:**
- Battery percentage < 0%

**Solution:**

Check battery floor logic in `mqttService.js`:

```javascript
newBattery = Math.max(newBattery, this.BATTERY_FLOOR); // Should be 0.0
```

---

### Issue: "Device Not Found" on Reset

**Symptoms:**
- POST `/api/devices/:deviceId/battery/reset` returns 404

**Solution:**

1. Verify device ID format (case-sensitive):
   ```sql
   SELECT deviceid FROM device ORDER BY deviceid;
   ```

2. Check exact device ID:
   ```bash
   curl http://localhost:5000/api/devices | jq '.data[].deviceid'
   ```

---

### Issue: Battery Reset Not Working

**Symptoms:**
- Reset API succeeds but battery unchanged in frontend

**Solution:**

1. Frontend may be caching data - force refresh
2. Check if frontend is querying latest battery:
   ```sql
   SELECT * FROM devicehealth
   WHERE deviceid = 'DEV-LT2-ORG'
   ORDER BY timestamp DESC
   LIMIT 1;
   ```

---

## Maintenance

### View Battery History

```sql
SELECT
  deviceid,
  battery_percentage,
  timestamp
FROM devicehealth
WHERE deviceid = 'DEV-LT2-ORG'
ORDER BY timestamp DESC
LIMIT 100;
```

### Clean Up Old Battery Records

Keep last 1000 records per device:

```sql
DELETE FROM devicehealth
WHERE healthid IN (
  SELECT healthid FROM (
    SELECT healthid,
           ROW_NUMBER() OVER (PARTITION BY deviceid ORDER BY timestamp DESC) as rn
    FROM devicehealth
  ) t
  WHERE rn > 1000
);
```

### Monitor Low Battery Devices

```sql
SELECT
  d.deviceid,
  d.category,
  dh.battery_percentage,
  dh.timestamp
FROM device d
LEFT JOIN LATERAL (
  SELECT battery_percentage, timestamp
  FROM devicehealth
  WHERE deviceid = d.deviceid
  ORDER BY timestamp DESC
  LIMIT 1
) dh ON true
WHERE dh.battery_percentage < 20
ORDER BY dh.battery_percentage ASC;
```

---

## Future Enhancements

- [ ] Email alerts when battery < 20%
- [ ] Battery replacement scheduling system
- [ ] Battery life prediction (ML model)
- [ ] Auto-reset on device replacement (RFID scan)
- [ ] Battery analytics dashboard
- [ ] Export battery history to CSV
- [ ] SMS notifications for critical battery

---

## Support

For issues or questions, contact:
- **Email:** support@wastewatcher.com
- **GitHub Issues:** https://github.com/wastewatcher/issues
- **Documentation:** https://docs.wastewatcher.com

---

**Last Updated:** January 20, 2025
**Version:** 1.0.0
