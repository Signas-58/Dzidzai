import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

class PrismaService {
  private static instance: PrismaClient;

  static getInstance(): PrismaClient {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaClient({
        log: [
          {
            emit: 'event',
            level: 'query',
          },
          {
            emit: 'event',
            level: 'error',
          },
          {
            emit: 'event',
            level: 'info',
          },
          {
            emit: 'event',
            level: 'warn',
          },
        ],
      });

      PrismaService.instance.$on('query', (e: any) => {
        logger.debug('Query: ' + e.query);
        logger.debug('Params: ' + e.params);
        logger.debug('Duration: ' + e.duration + 'ms');
      });

      PrismaService.instance.$on('error', (e: any) => {
        logger.error('Prisma error: ' + e.message);
      });

      PrismaService.instance.$on('info', (e: any) => {
        logger.info('Prisma info: ' + e.message);
      });

      PrismaService.instance.$on('warn', (e: any) => {
        logger.warn('Prisma warning: ' + e.message);
      });
    }

    return PrismaService.instance;
  }

  static async disconnect(): Promise<void> {
    if (PrismaService.instance) {
      await PrismaService.instance.$disconnect();
    }
  }
}

export const prisma = PrismaService.getInstance();

// Graceful shutdown
process.on('beforeExit', async () => {
  await PrismaService.disconnect();
});

process.on('SIGINT', async () => {
  await PrismaService.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await PrismaService.disconnect();
  process.exit(0);
});
