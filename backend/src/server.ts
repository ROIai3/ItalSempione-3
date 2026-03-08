import { env } from './config/env';
import app from './app';
import logger from './utils/logger';
import { db } from './config/database';

async function main() {
  // Verify database connectivity
  try {
    await db.raw('SELECT 1');
    logger.info('Database connection established');
  } catch (err) {
    logger.fatal({ err }, 'Failed to connect to database');
    process.exit(1);
  }

  // Start HTTP server
  const server = app.listen(env.PORT, () => {
    logger.info(
      {
        port: env.PORT,
        env: env.NODE_ENV,
        n8nWebhookBase: env.N8N_WEBHOOK_BASE,
      },
      `ItalSempione backend running on port ${env.PORT}`
    );
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutdown signal received, closing gracefully...');

    server.close(async () => {
      try {
        await db.destroy();
        logger.info('Database connections closed');
      } catch (err) {
        logger.error({ err }, 'Error closing database connections');
      }
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
