const { pool, testConnection } = require('../config/database');

describe('Database Connection Tests', () => {
  afterAll(async () => {
    await pool.end();
  });

  test('should connect to database successfully', async () => {
    await expect(testConnection()).resolves.not.toThrow();
  });

  test('should execute basic query', async () => {
    const client = await pool.connect();
    const result = await client.query('SELECT 1 as test');
    expect(result.rows[0].test).toBe(1);
    client.release();
  });

  test('should fetch trash bins', async () => {
    const client = await pool.connect();
    const result = await client.query('SELECT COUNT(*) FROM TrashBin');
    expect(result.rows[0].count).toBeGreaterThanOrEqual(0);
    client.release();
  });

  test('should fetch devices', async () => {
    const client = await pool.connect();
    const result = await client.query('SELECT COUNT(*) FROM Device');
    expect(result.rows[0].count).toBeGreaterThanOrEqual(0);
    client.release();
  });
});