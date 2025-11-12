const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'wastewatcher_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function getSpecificIntervals() {
  try {
    console.log('Getting data for 11/02/2025 00:00-01:00 WIB (5-minute intervals)\n');

    // 11/02/2025 00:00 WIB = 11/01/2025 17:00 UTC
    const startUTC = '2025-11-01 17:00:00';
    const endUTC = '2025-11-01 17:59:59';

    console.log(`UTC Range: ${startUTC} to ${endUTC}`);
    console.log(`WIB Range: 2025-11-02 00:00:00 to 2025-11-02 00:59:59\n`);

    // Get 5-minute aggregated data
    const query = `
      SELECT
        DATE_TRUNC('minute', wd.timestamp) +
        INTERVAL '5 minute' * FLOOR(EXTRACT(MINUTE FROM wd.timestamp) / 5) as time_interval,
        d.deviceid,
        d.category,
        COUNT(DISTINCT wd.weightdataid) as data_points,
        ROUND(AVG(wd.weight_kg)::numeric, 2) as avg_weight
      FROM weightdata wd
      INNER JOIN sensor s ON wd.sensorid = s.sensorid
      INNER JOIN device d ON s.deviceid = d.deviceid
      WHERE d.trashbinid = 'TB_KANTIN_LT1'
        AND wd.timestamp >= $1::timestamp
        AND wd.timestamp <= $2::timestamp
      GROUP BY time_interval, d.deviceid, d.category
      ORDER BY time_interval, d.deviceid;
    `;

    const result = await pool.query(query, [startUTC, endUTC]);

    console.log(`Total records: ${result.rows.length}\n`);

    // Aggregate by timestamp
    const aggregated = {};
    result.rows.forEach(row => {
      const utcTime = new Date(row.time_interval);
      const wibTime = new Date(utcTime.getTime() + (7 * 60 * 60 * 1000)); // Add 7 hours
      const timeKey = utcTime.toISOString();

      if (!aggregated[timeKey]) {
        aggregated[timeKey] = {
          utc: utcTime.toISOString(),
          wib: wibTime.toISOString(),
          wibTime: wibTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          devices: [],
          totalWeight: 0
        };
      }

      aggregated[timeKey].devices.push({
        category: row.category,
        weight: parseFloat(row.avg_weight)
      });
      aggregated[timeKey].totalWeight += parseFloat(row.avg_weight || 0);
    });

    // Get specific 5-minute intervals
    const specificTimes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

    console.log('=== 5-Minute Interval Data (for chart) ===\n');

    Object.values(aggregated).forEach(item => {
      const minute = item.wibTime.split(':')[1];
      if (specificTimes.includes(minute)) {
        console.log(`WIB Time: ${item.wibTime}`);
        console.log(`UTC Time: ${item.utc}`);
        item.devices.forEach(d => {
          console.log(`  - ${d.category}: ${d.weight} kg`);
        });
        console.log(`  Total Weight: ${item.totalWeight.toFixed(2)} kg`);
        console.log('');
      }
    });

    console.log('\n=== Summary for Frontend ===\n');
    const chartData = Object.values(aggregated)
      .filter(item => {
        const minute = item.wibTime.split(':')[1];
        return specificTimes.includes(minute);
      })
      .map(item => ({
        time: item.wibTime,
        fullTimestamp: item.wibTime,
        value: parseFloat(item.totalWeight.toFixed(2)),
        devices: item.devices
      }));

    console.log(`Total chart points: ${chartData.length}`);
    console.log('\nChart Data:');
    console.table(chartData);

    await pool.end();
    console.log('\nDatabase connection closed.');
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

getSpecificIntervals();
