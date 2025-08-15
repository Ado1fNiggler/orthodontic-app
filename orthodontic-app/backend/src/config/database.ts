import { PrismaClient } from '@prisma/client';
import { createConnection } from 'mysql2/promise';
import { logger } from '../utils/logger.js';

// Prisma client for PostgreSQL (main database)
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// MySQL connection for legacy booking system
let mysqlConnection: any = null;

export const connectPostgreSQL = async () => {
  try {
    await prisma.$connect();
    logger.info('✅ Connected to PostgreSQL database');
    return prisma;
  } catch (error) {
    logger.error('❌ Failed to connect to PostgreSQL:', error);
    throw error;
  }
};

export const connectMySQL = async () => {
  try {
    if (!mysqlConnection) {
      mysqlConnection = await createConnection({
        host: process.env.MYSQL_HOST || 'localhost',
        port: parseInt(process.env.MYSQL_PORT || '3306'),
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        charset: 'utf8mb4',
        timezone: '+00:00',
      });
    }
    
    logger.info('✅ Connected to MySQL (Legacy Booking System)');
    return mysqlConnection;
  } catch (error) {
    logger.error('❌ Failed to connect to MySQL:', error);
    throw error;
  }
};

export const disconnectDatabases = async () => {
  try {
    await prisma.$disconnect();
    if (mysqlConnection) {
      await mysqlConnection.end();
      mysqlConnection = null;
    }
    logger.info('🔌 Database connections closed');
  } catch (error) {
    logger.error('❌ Error closing database connections:', error);
  }
};

// Health check for databases
export const checkDatabaseHealth = async () => {
  const health = {
    postgresql: false,
    mysql: false,
    timestamp: new Date().toISOString()
  };

  try {
    // Check PostgreSQL
    await prisma.$queryRaw`SELECT 1`;
    health.postgresql = true;
  } catch (error) {
    logger.error('PostgreSQL health check failed:', error);
  }

  try {
    // Check MySQL
    const mysql = await connectMySQL();
    await mysql.query('SELECT 1');
    health.mysql = true;
  } catch (error) {
    logger.error('MySQL health check failed:', error);
  }

  return health;
};

export { prisma };
export default prisma;