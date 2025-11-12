const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'wastewatcher_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function checkAvailableData() {
  try {
    console.log('Connecting to database...\n');

    // Check what data exists for Kantin LT1
    const dataRangeQuery = `
      SELECT
        d.deviceid,
        d.category,
        COUNT(*) as total_records,
        MIN(wd.timestamp) as earliest_data,
        MAX(wd.timestamp) as latest_data,
        DATE(MIN(wd.timestamp)) as first_date,
        DATE(MAX(wd.timestamp)) as last_date
      FROM weightdata wd
      JOIN sensor s ON wd.sensorid = s.sensorid
      JOIN device d ON s.deviceid = d.deviceid
      WHERE d.trashbinid = 'TB_KANTIN_LT1'
      GROUP BY d.deviceid, d.category
      ORDER BY d.category;
    `;
    const rangeResult = await pool.query(dataRangeQuery);
    console.log('Data range for Kantin LT1 devices:');
    console.log(rangeResult.rows);
    console.log('\n');

    if (rangeResult.rows.length > 0) {
      const firstDevice = rangeResult.rows[0];
      const latestDate = new Date(firstDevice.latest_data);
      console.log(`Latest data timestamp: ${latestDate.toISOString()}\n`);

      // Check data for the latest day
      console.log('Checking data for the most recent day...\n');

      const latestDayQuery = `
        SELECT
          d.deviceid,
          d.category,
          DATE(wd.timestamp) as data_date,
          COUNT(*) as records_count,
          MIN(wd.timestamp) as first_timestamp,
          MAX(wd.timestamp) as last_timestamp,
          ROUND(MIN(wd.weight_kg)::numeric, 2) as min_weight,
          ROUND(MAX(wd.weight_kg)::numeric, 2) as max_weight,
          ROUND(AVG(wd.weight_kg)::numeric, 2) as avg_weight
        FROM weightdata wd
        JOIN sensor s ON wd.sensorid = s.sensorid
        JOIN device d ON s.deviceid = d.deviceid
        WHERE d.trashbinid = 'TB_KANTIN_LT1'
          AND DATE(wd.timestamp) = (
            SELECT MAX(DATE(timestamp))
            FROM weightdata wd2
            JOIN sensor s2 ON wd2.sensorid = s2.sensorid
            JOIN device d2 ON s2.deviceid = d2.deviceid
            WHERE d2.trashbinid = 'TB_KANTIN_LT1'
          )
        GROUP BY d.deviceid, d.category, DATE(wd.timestamp)
        ORDER BY d.category;
      `;
      const latestDayResult = await pool.query(latestDayQuery);
      console.log('Latest day statistics:');
      console.log(latestDayResult.rows);
      console.log('\n');

      // Check hourly distribution for the latest day
      if (latestDayResult.rows.length > 0) {
        const latestDay = latestDayResult.rows[0].data_date;
        console.log(`Hourly data distribution for ${latestDay}:\n`);

        const hourlyDistQuery = `
          SELECT
            EXTRACT(HOUR FROM wd.timestamp) as hour,
            d.category,
            COUNT(*) as record_count,
            ROUND(AVG(wd.weight_kg)::numeric, 2) as avg_weight
          FROM weightdata wd
          JOIN sensor s ON wd.sensorid = s.sensorid
          JOIN device d ON s.deviceid = d.deviceid
          WHERE d.trashbinid = 'TB_KANTIN_LT1'
            AND DATE(wd.timestamp) = $1
          GROUP BY EXTRACT(HOUR FROM wd.timestamp), d.category
          ORDER BY hour, d.category
          LIMIT 30;
        `;
        const hourlyDistResult = await pool.query(hourlyDistQuery, [latestDay]);
        console.log('Hourly distribution (showing first 30 entries):');
        console.log(hourlyDistResult.rows);
        console.log('\n');

        // Sample data from hour 0 and hour 1
        console.log('Sample data from hours 0 and 1:\n');
        const sampleQuery = `
          SELECT
            wd.timestamp,
            d.category,
            wd.weight_kg,
            s.sensor_position
          FROM weightdata wd
          JOIN sensor s ON wd.sensorid = s.sensorid
          JOIN device d ON s.deviceid = d.deviceid
          WHERE d.trashbinid = 'TB_KANTIN_LT1'
            AND DATE(wd.timestamp) = $1
            AND EXTRACT(HOUR FROM wd.timestamp) IN (0, 1)
          ORDER BY wd.timestamp, d.category
          LIMIT 20;
        `;
        const sampleResult = await pool.query(sampleQuery, [latestDay]);
        console.log('Sample records from hours 0 and 1:');
        console.log(sampleResult.rows);
      }
    }

    await pool.end();
    console.log('\nDatabase connection closed.');
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

checkAvailableData();
