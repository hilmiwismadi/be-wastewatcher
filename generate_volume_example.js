const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'wastewatcher_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function generateVolumeExample() {
  try {
    console.log('Generating volume data example...\n');

    // Query for detailed volume data
    const query = `
      SELECT
        vd.volumedataid,
        vd.timestamp,
        vd.timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta' as wib_timestamp,
        vd.fill_percentage,
        vd.distance_cm,
        vd.raw_reading,
        s.sensorid,
        s.sensor_position,
        d.deviceid,
        d.category,
        tb.trashbinid,
        tb.name as bin_name
      FROM volumedata vd
      INNER JOIN sensor s ON vd.sensorid = s.sensorid
      INNER JOIN device d ON s.deviceid = d.deviceid
      INNER JOIN trashbin tb ON d.trashbinid = tb.trashbinid
      WHERE vd.timestamp >= '2025-11-02 00:00:00'::timestamp
        AND vd.timestamp <= '2025-11-02 01:00:00'::timestamp
        AND tb.trashbinid = 'TB_KANTIN_LT1'
      ORDER BY vd.timestamp, d.category, s.sensor_position
      LIMIT 300
    `;

    const result = await pool.query(query);

    console.log(`Retrieved ${result.rows.length} volume records\n`);

    // Group by timestamp and device
    const byTimestamp = {};
    result.rows.forEach(row => {
      const utcTime = new Date(row.timestamp);
      const wibTime = new Date(row.wib_timestamp);

      const utcKey = `${String(utcTime.getUTCHours()).padStart(2, '0')}:${String(utcTime.getUTCMinutes()).padStart(2, '0')}`;
      const wibKey = `${String(wibTime.getUTCHours()).padStart(2, '0')}:${String(wibTime.getUTCMinutes()).padStart(2, '0')}`;

      const key = `${utcKey} (${wibKey} WIB)`;

      if (!byTimestamp[key]) {
        byTimestamp[key] = {
          utcTime: utcKey,
          wibTime: wibKey,
          devices: {}
        };
      }

      const deviceKey = row.category;
      if (!byTimestamp[key].devices[deviceKey]) {
        byTimestamp[key].devices[deviceKey] = [];
      }

      byTimestamp[key].devices[deviceKey].push({
        sensorPosition: row.sensor_position,
        fillPercentage: parseFloat(row.fill_percentage),
        distanceCm: parseFloat(row.distance_cm),
        sensorId: row.sensorid
      });
    });

    // Generate markdown content
    let markdown = `# Volume Data Example: TB_KANTIN_LT1

## Time Range
- **UTC**: 2025-11-02 00:00:00 to 2025-11-02 01:00:00
- **WIB**: 2025-11-02 07:00:00 to 2025-11-02 08:00:00

## Data Structure

Each trash bin (TB_KANTIN_LT1) has **3 devices** (Organic, Anorganic, Residue).
Each device has **4 ultrasonic sensors** at different positions (Top, Upper-Mid, Lower-Mid, Bottom).

### Hardware Configuration
- **Sensors per device**: 4 ultrasonic sensors
- **Sensor positions**: 1 (Top), 2 (Upper-Mid), 3 (Lower-Mid), 4 (Bottom)
- **Total sensors per bin**: 3 devices × 4 sensors = 12 sensors
- **Reading frequency**: ~1 reading per sensor per minute
- **Data points per minute**: 4 sensors × 3 devices = 12 readings

### Volume Calculation
For each device, the 4 sensor readings are **averaged** to get the device's fill percentage.

---

## Sample Data (First 10 Minutes)

`;

    // Get first 10 unique timestamps
    const timestamps = Object.keys(byTimestamp).sort().slice(0, 10);

    timestamps.forEach((timeKey, index) => {
      const data = byTimestamp[timeKey];

      markdown += `### ${index + 1}. ${timeKey}\n\n`;

      ['Organic', 'Anorganic', 'Residue'].forEach(category => {
        const sensors = data.devices[category] || [];

        if (sensors.length > 0) {
          markdown += `#### ${category} Device\n`;
          markdown += `| Sensor Position | Sensor ID | Fill % | Distance (cm) |\n`;
          markdown += `|----------------|-----------|---------|---------------|\n`;

          sensors.forEach(sensor => {
            const position = sensor.sensorPosition === 1 ? 'Top' :
                           sensor.sensorPosition === 2 ? 'Upper-Mid' :
                           sensor.sensorPosition === 3 ? 'Lower-Mid' : 'Bottom';
            markdown += `| ${sensor.sensorPosition} (${position}) | ${sensor.sensorId} | ${sensor.fillPercentage.toFixed(2)}% | ${sensor.distanceCm.toFixed(2)} |\n`;
          });

          // Calculate average
          const avgFill = sensors.reduce((sum, s) => sum + s.fillPercentage, 0) / sensors.length;
          markdown += `\n**Average Fill Percentage**: ${avgFill.toFixed(2)}%\n\n`;
        }
      });

      markdown += `---\n\n`;
    });

    // Add aggregated 5-minute interval summary
    markdown += `## 5-Minute Interval Aggregation (Chart Data)\n\n`;
    markdown += `This is what the frontend chart displays:\n\n`;
    markdown += `| Time (WIB) | Organic Avg % | Anorganic Avg % | Residue Avg % | Total Avg % |\n`;
    markdown += `|------------|---------------|-----------------|---------------|-------------|\n`;

    // Group by 5-minute intervals
    const fiveMinIntervals = {};
    Object.keys(byTimestamp).forEach(timeKey => {
      const data = byTimestamp[timeKey];
      const [hours, minutes] = data.wibTime.split(':');
      const interval = Math.floor(parseInt(minutes) / 5) * 5;
      const intervalKey = `${hours}:${String(interval).padStart(2, '0')}`;

      if (!fiveMinIntervals[intervalKey]) {
        fiveMinIntervals[intervalKey] = {
          Organic: [],
          Anorganic: [],
          Residue: []
        };
      }

      ['Organic', 'Anorganic', 'Residue'].forEach(category => {
        const sensors = data.devices[category] || [];
        if (sensors.length > 0) {
          const avgFill = sensors.reduce((sum, s) => sum + s.fillPercentage, 0) / sensors.length;
          fiveMinIntervals[intervalKey][category].push(avgFill);
        }
      });
    });

    Object.keys(fiveMinIntervals).sort().slice(0, 12).forEach(intervalKey => {
      const data = fiveMinIntervals[intervalKey];

      const organicAvg = data.Organic.length > 0
        ? data.Organic.reduce((sum, v) => sum + v, 0) / data.Organic.length
        : 0;
      const anorganicAvg = data.Anorganic.length > 0
        ? data.Anorganic.reduce((sum, v) => sum + v, 0) / data.Anorganic.length
        : 0;
      const residueAvg = data.Residue.length > 0
        ? data.Residue.reduce((sum, v) => sum + v, 0) / data.Residue.length
        : 0;

      const totalAvg = (organicAvg + anorganicAvg + residueAvg) / 3;

      markdown += `| ${intervalKey} | ${organicAvg.toFixed(2)}% | ${anorganicAvg.toFixed(2)}% | ${residueAvg.toFixed(2)}% | ${totalAvg.toFixed(2)}% |\n`;
    });

    markdown += `\n## Notes\n\n`;
    markdown += `- Each minute has 4 sensor readings per device (from 4 different positions)\n`;
    markdown += `- The device's fill percentage is the **average** of these 4 sensor readings\n`;
    markdown += `- For the chart, data is further aggregated into 5-minute intervals\n`;
    markdown += `- Chart shows the average of all readings within each 5-minute window\n`;
    markdown += `- Total sensors reporting: 12 (3 devices × 4 sensors per device)\n`;

    // Write to file
    const filename = 'VOLUME_DATA_EXAMPLE.md';
    fs.writeFileSync(filename, markdown);

    console.log(`✓ Markdown file generated: ${filename}`);
    console.log(`✓ Total records processed: ${result.rows.length}`);
    console.log(`✓ Unique timestamps: ${Object.keys(byTimestamp).length}`);
    console.log(`✓ 5-minute intervals: ${Object.keys(fiveMinIntervals).length}`);

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

generateVolumeExample();
