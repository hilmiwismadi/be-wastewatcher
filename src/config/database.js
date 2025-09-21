const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'wastewatcher_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
  connectionTimeoutMillis: 2000, // How long to wait when connecting a new client
});

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');

    // Test query
    const result = await client.query('SELECT NOW()');
    console.log('📅 Database time:', result.rows[0].now);

    client.release();
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    throw error;
  }
};

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🔄 Closing database connections...');
  pool.end(() => {
    console.log('✅ Database connections closed');
    process.exit(0);
  });
});

module.exports = {
  pool,
  testConnection
};