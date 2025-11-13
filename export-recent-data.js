const { Client } = require('pg');
const fs = require('fs');

const LOCAL_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/wastewatcher_db';

async function exportRecentData() {
  const client = new Client({ connectionString: LOCAL_DATABASE_URL });

  try {
    await client.connect();
    console.log('✅ Connected to LOCAL database\n');

    let exportSQL = '-- Exported from local database (RECENT DATA ONLY)\n';
    exportSQL += '-- Generated: ' + new Date().toISOString() + '\n';
    exportSQL += '-- Data from last 30 days\n\n';

    // Helper function to export table
    async function exportTable(tableName, query, description) {
      console.log(`📦 Exporting ${description}...`);
      const result = await client.query(query);

      if (result.rows.length === 0) {
        console.log(`   ⚠️  No data`);
        return;
      }

      console.log(`   ✅ ${result.rows.length} rows`);

      for (const row of result.rows) {
        const columns = Object.keys(row);
        const values = columns.map(col => {
          const val = row[col];
          if (val === null) return 'NULL';
          if (typeof val === 'number') return val;
          if (typeof val === 'boolean') return val;
          if (val instanceof Date) return `'${val.toISOString()}'`;
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
          return `'${String(val).replace(/'/g, "''")}'`;
        });

        exportSQL += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;\n`;
      }
      exportSQL += '\n';
    }

    // Export all trash bins and devices (no date filter)
    await exportTable('trashbin', 'SELECT * FROM trashbin', 'trash bins');
    await exportTable('device', 'SELECT * FROM device', 'devices');
    await exportTable('sensor', 'SELECT * FROM sensor', 'sensors');
    await exportTable('binstatus', 'SELECT * FROM binstatus', 'bin status');
    await exportTable('devicehealth', 'SELECT * FROM devicehealth ORDER BY timestamp DESC LIMIT 200', 'recent device health');

    // Export RECENT weight data (last 30 days)
    await exportTable(
      'weightdata',
      `SELECT * FROM weightdata WHERE timestamp > NOW() - INTERVAL '30 days' ORDER BY timestamp DESC LIMIT 10000`,
      'recent weight data (30 days, max 10k rows)'
    );

    // Export RECENT volume data (last 30 days)
    await exportTable(
      'volumedata',
      `SELECT * FROM volumedata WHERE timestamp > NOW() - INTERVAL '30 days' ORDER BY timestamp DESC LIMIT 10000`,
      'recent volume data (30 days, max 10k rows)'
    );

    // Export daily analytics (last 30 days)
    await exportTable(
      'dailyanalytics',
      `SELECT * FROM dailyanalytics WHERE analysis_date > NOW() - INTERVAL '30 days'`,
      'daily analytics (30 days)'
    );

    // Export other tables
    await exportTable('"User"', 'SELECT * FROM "User"', 'users');
    await exportTable('sensortype', 'SELECT * FROM sensortype', 'sensor types');
    await exportTable('wastecategory', 'SELECT * FROM wastecategory', 'waste categories');

    // Write to file
    const filename = 'railway-import-recent.sql';
    fs.writeFileSync(filename, exportSQL);
    console.log(`\n✅ Export complete: ${filename}`);
    console.log(`📊 File size: ${(fs.statSync(filename).size / 1024).toFixed(2)} KB`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

exportRecentData();
