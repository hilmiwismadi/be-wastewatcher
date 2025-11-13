const { Client } = require('pg');
const fs = require('fs');

const LOCAL_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/wastewatcher_db';

async function exportData() {
  const client = new Client({ connectionString: LOCAL_DATABASE_URL });

  try {
    await client.connect();
    console.log('✅ Connected to LOCAL database\n');

    // Export all tables
    const tables = [
      'trashbin',
      'device',
      'sensor',
      'weightdata',
      'volumedata',
      'binstatus',
      'binstatushistory',
      'devicehealth',
      'dailyanalytics',
      'alertlog',
      '"User"',
      'usersession',
      'sensortype',
      'wastecategory'
    ];

    let exportSQL = '-- Exported from local database\n';
    exportSQL += '-- Generated: ' + new Date().toISOString() + '\n\n';
    exportSQL += '-- Truncate all tables first\n';

    for (const table of tables) {
      exportSQL += `TRUNCATE TABLE ${table} CASCADE;\n`;
    }
    exportSQL += '\n';

    for (const table of tables) {
      console.log(`📦 Exporting ${table}...`);

      const result = await client.query(`SELECT * FROM ${table}`);

      if (result.rows.length === 0) {
        console.log(`   ⚠️  No data in ${table}`);
        continue;
      }

      console.log(`   ✅ ${result.rows.length} rows`);

      // Generate INSERT statements
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

        exportSQL += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
      }
      exportSQL += '\n';
    }

    // Write to file
    const filename = 'railway-import.sql';
    fs.writeFileSync(filename, exportSQL);
    console.log(`\n✅ Export complete: ${filename}`);
    console.log(`📊 File size: ${(fs.statSync(filename).size / 1024).toFixed(2)} KB`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

exportData();
