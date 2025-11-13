const { Client } = require('pg');
const fs = require('fs');
const readline = require('readline');

const RAILWAY_DATABASE_URL = 'postgresql://postgres:TcRRtmZYRKQDLNyncAkIYPjmlDzgeWSj@ballast.proxy.rlwy.net:40244/railway';
const BATCH_SIZE = 1000; // Process 1000 lines at a time

async function importDataBatch() {
  const client = new Client({ connectionString: RAILWAY_DATABASE_URL });

  try {
    await client.connect();
    console.log('✅ Connected to RAILWAY database\n');

    const filename = 'railway-import.sql';
    if (!fs.existsSync(filename)) {
      console.error(`❌ File not found: ${filename}`);
      return;
    }

    console.log('📝 Starting batch import...');
    console.log(`📊 File size: ${(fs.statSync(filename).size / 1024 / 1024).toFixed(2)} MB\n`);

    const fileStream = fs.createReadStream(filename);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let batch = [];
    let lineCount = 0;
    let batchCount = 0;

    for await (const line of rl) {
      lineCount++;

      // Skip comments and empty lines
      if (line.trim().startsWith('--') || line.trim() === '') {
        continue;
      }

      batch.push(line);

      // Execute batch when it reaches BATCH_SIZE
      if (batch.length >= BATCH_SIZE) {
        batchCount++;
        const sql = batch.join('\n');
        try {
          await client.query(sql);
          process.stdout.write(`\r⏳ Processed ${lineCount} lines (${batchCount} batches)`);
        } catch (error) {
          console.error(`\n❌ Error in batch ${batchCount}:`, error.message);
        }
        batch = [];
      }
    }

    // Execute remaining batch
    if (batch.length > 0) {
      batchCount++;
      const sql = batch.join('\n');
      await client.query(sql);
      process.stdout.write(`\r⏳ Processed ${lineCount} lines (${batchCount} batches)`);
    }

    console.log('\n\n✅ Import complete!');
    console.log(`📊 Total lines processed: ${lineCount}`);
    console.log(`📦 Total batches: ${batchCount}`);
    console.log('\n🎉 All data has been imported to Railway database');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

importDataBatch();
