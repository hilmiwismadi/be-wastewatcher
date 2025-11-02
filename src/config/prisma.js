/**
 * Prisma Client Instance
 * Singleton pattern for database connection
 * Provides centralized database access throughout the application
 */

const { PrismaClient } = require('../generated/prisma');

// Create Prisma Client instance with logging configuration
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'stdout',
      level: 'error',
    },
    {
      emit: 'stdout',
      level: 'info',
    },
    {
      emit: 'stdout',
      level: 'warn',
    },
  ],
});

// Log queries in development mode
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    console.log('Query: ' + e.query);
    console.log('Params: ' + e.params);
    console.log('Duration: ' + e.duration + 'ms');
  });
}

// Test connection
const testPrismaConnection = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Prisma connected to database successfully');

    // Test query
    const result = await prisma.$queryRaw`SELECT NOW() as now`;
    console.log('📅 Database time:', result[0].now);
  } catch (error) {
    console.error('❌ Prisma connection error:', error.message);
    throw error;
  }
};

// Graceful shutdown
const disconnectPrisma = async () => {
  await prisma.$disconnect();
  console.log('✅ Prisma disconnected from database');
};

process.on('SIGINT', async () => {
  console.log('🔄 Closing Prisma connection...');
  await disconnectPrisma();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Closing Prisma connection...');
  await disconnectPrisma();
  process.exit(0);
});

module.exports = {
  prisma,
  testPrismaConnection,
  disconnectPrisma
};
