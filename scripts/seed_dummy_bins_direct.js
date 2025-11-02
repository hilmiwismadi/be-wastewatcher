const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Generate random percentage between min and max
function randomPercentage(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

// Generate random weight based on percentage (rough estimation)
function calculateWeight(percentage) {
  return Math.round((percentage / 100 * 5) * 10) / 10;
}

// Get status based on percentage
function getStatus(percentage) {
  if (percentage >= 90) return 'overflowing';
  if (percentage >= 75) return 'full';
  if (percentage >= 50) return 'high';
  if (percentage >= 25) return 'medium';
  if (percentage >= 10) return 'low';
  return 'empty';
}

// Get condition
function getCondition(percentage) {
  const conditions = ['even', 'north_heavy', 'south_heavy', 'east_heavy', 'west_heavy', 'uneven'];
  if (percentage >= 75) {
    // More likely to be uneven or directional when full
    return conditions[Math.floor(Math.random() * 5) + 1];
  }
  // More likely to be even when not full
  return Math.random() > 0.7 ? conditions[0] : conditions[Math.floor(Math.random() * conditions.length)];
}

async function seedDatabase() {
  const client = await pool.connect();

  try {
    console.log('Starting database seeding...\n');

    await client.query('BEGIN');

    // Define bin data
    const directions = ['Utara', 'Timur', 'Barat', 'Selatan'];
    const floors = [1, 2, 3, 4, 5, 6];
    const categories = ['Organic', 'Anorganic', 'Residue'];

    // Generate bins for each floor
    const bins = [];
    let binCount = 0;

    for (const floor of floors) {
      const numDirections = floor === 3 || floor === 6 ? 3 : 4; // LT3 and LT6 have only 3 bins
      for (let i = 0; i < numDirections; i++) {
        const direction = directions[i];
        bins.push({
          id: `TB-${direction.toUpperCase()}-LT${floor}`,
          name: `${direction} LT ${floor}`,
          location: `${direction} Wing Level ${floor}`,
          floor: `Lantai ${floor}`,
          direction,
          floorNum: floor
        });
        binCount++;
      }
    }

    console.log(`Creating ${bins.length} trash bins...`);

    // Insert trash bins
    for (const bin of bins) {
      await client.query(
        `INSERT INTO trashbin (trashbinid, name, location, area, floor, capacity_liters, installation_date, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (trashbinid) DO NOTHING`,
        [bin.id, bin.name, bin.location, 'Academic Building', bin.floor, 240, '2024-01-15', 'active']
      );
    }

    console.log(`✓ Created ${bins.length} trash bins`);

    // Insert devices for each bin
    console.log(`\nCreating devices (3 per bin)...`);
    let deviceCount = 0;

    for (const bin of bins) {
      for (const category of categories) {
        const deviceId = `DEV-${bin.direction.toUpperCase()}-LT${bin.floorNum}-${category.substring(0, 3).toUpperCase()}`;

        await client.query(
          `INSERT INTO device (deviceid, trashbinid, category, installation_date, status)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (deviceid) DO NOTHING`,
          [deviceId, bin.id, category, '2024-01-15', 'active']
        );
        deviceCount++;
      }
    }

    console.log(`✓ Created ${deviceCount} devices`);

    // Insert bin status for each device with randomized data
    console.log(`\nCreating bin status entries with randomized data...`);
    let statusCount = 0;

    for (const bin of bins) {
      for (const category of categories) {
        const deviceId = `DEV-${bin.direction.toUpperCase()}-LT${bin.floorNum}-${category.substring(0, 3).toUpperCase()}`;
        const binStatusId = `BS-${bin.direction.substring(0, 1)}${bin.floorNum}${category.substring(0, 1)}`;

        // Generate randomized data
        const percentage = randomPercentage(15, 95);
        const weight = calculateWeight(percentage);
        const status = getStatus(percentage);
        const condition = getCondition(percentage);

        // Check if bin status already exists
        const existingStatus = await client.query(
          'SELECT binstatusid FROM binstatus WHERE deviceid = $1',
          [deviceId]
        );

        if (existingStatus.rows.length === 0) {
          await client.query(
            `INSERT INTO binstatus (binstatusid, deviceid, total_weight_kg, average_volume_percentage, status, condition)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [binStatusId, deviceId, weight, percentage, status, condition]
          );
        } else {
          await client.query(
            `UPDATE binstatus SET
               total_weight_kg = $3,
               average_volume_percentage = $4,
               status = $5,
               condition = $6
             WHERE deviceid = $2`,
            [binStatusId, deviceId, weight, percentage, status, condition]
          );
        }
        statusCount++;
      }
    }

    console.log(`✓ Created ${statusCount} bin status entries`);

    // Insert device health for each device
    console.log(`\nCreating device health entries...`);
    let healthCount = 0;

    for (const bin of bins) {
      for (const category of categories) {
        const deviceId = `DEV-${bin.direction.toUpperCase()}-LT${bin.floorNum}-${category.substring(0, 3).toUpperCase()}`;
        const healthId = `DH-${bin.direction.substring(0, 1)}${bin.floorNum}${category.substring(0, 1)}`;

        const batteryPercentage = Math.floor(Math.random() * 31) + 65; // 65-95%
        const errorCount = Math.random() > 0.85 ? Math.floor(Math.random() * 3) + 1 : 0; // 15% chance of errors

        await client.query(
          `INSERT INTO devicehealth (healthid, deviceid, battery_percentage, error_count_24h)
           VALUES ($1, $2, $3, $4)`,
          [healthId, deviceId, batteryPercentage, errorCount]
        );
        healthCount++;
      }
    }

    console.log(`✓ Created ${healthCount} device health entries`);

    await client.query('COMMIT');

    console.log('\n✅ Database seeding completed successfully!\n');

    // Verify the data
    const binResult = await client.query('SELECT COUNT(*) FROM trashbin WHERE name LIKE \'%LT%\'');
    console.log(`📊 Total dummy bins in database: ${binResult.rows[0].count}`);

    const deviceResult = await client.query('SELECT COUNT(*) FROM device WHERE deviceid LIKE \'DEV-%LT%\'');
    console.log(`📊 Total dummy devices in database: ${deviceResult.rows[0].count}`);

    const statusResult = await client.query('SELECT COUNT(*) FROM binstatus WHERE binstatusid LIKE \'BS-%LT%\'');
    console.log(`📊 Total dummy bin status entries in database: ${statusResult.rows[0].count}`);

    const healthResult = await client.query('SELECT COUNT(*) FROM devicehealth WHERE healthid LIKE \'DH-%LT%\'');
    console.log(`📊 Total dummy device health entries in database: ${healthResult.rows[0].count}`);

    // Show status distribution
    console.log('\n📈 Status distribution:');
    const statusDist = await client.query(`
      SELECT status, COUNT(*) as count
      FROM binstatus
      WHERE binstatusid LIKE 'BS-%LT%'
      GROUP BY status
      ORDER BY status
    `);
    statusDist.rows.forEach(row => {
      console.log(`   ${row.status}: ${row.count}`);
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase();
