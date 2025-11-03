const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'wastewatcher_db',
  user: 'postgres',
  password: 'postgres'
});

async function checkDistribution() {
  try {
    console.log('\n📊 Bin Status Distribution Check\n');
    console.log('=' .repeat(60));

    // Get average fill percentage per bin
    const result = await pool.query(`
      SELECT
        tb.trashbinid,
        tb.name,
        ROUND(AVG(bs.average_volume_percentage)::numeric, 1) as avg_fill,
        CASE
          WHEN AVG(bs.average_volume_percentage) >= 81 THEN 'Penuh (Full)'
          WHEN AVG(bs.average_volume_percentage) >= 61 THEN 'Hampir Penuh (High)'
          WHEN AVG(bs.average_volume_percentage) >= 31 THEN 'Menengah (Medium)'
          WHEN AVG(bs.average_volume_percentage) >= 11 THEN 'Rendah (Low)'
          ELSE 'Kosong (Empty)'
        END as status_label
      FROM trashbin tb
      LEFT JOIN device d ON tb.trashbinid = d.trashbinid
      LEFT JOIN binstatus bs ON d.deviceid = bs.deviceid
      WHERE tb.status = 'active'
      GROUP BY tb.trashbinid, tb.name
      ORDER BY avg_fill DESC
    `);

    // Count by status
    const statusCounts = {
      'Penuh (Full)': 0,
      'Hampir Penuh (High)': 0,
      'Menengah (Medium)': 0,
      'Rendah (Low)': 0,
      'Kosong (Empty)': 0
    };

    console.log('\nBin Status Details:');
    console.log('-'.repeat(60));
    result.rows.forEach(row => {
      statusCounts[row.status_label]++;
      console.log(`${row.name.padEnd(20)} ${String(row.avg_fill).padStart(6)}%  ${row.status_label}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('\nStatus Distribution Summary:');
    console.log('-'.repeat(60));
    const total = result.rows.length;
    Object.entries(statusCounts).forEach(([status, count]) => {
      const percentage = ((count / total) * 100).toFixed(1);
      console.log(`${status.padEnd(25)} ${String(count).padStart(2)} bins (${percentage}%)`);
    });
    console.log('-'.repeat(60));
    console.log(`Total:                     ${total} bins\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDistribution();
