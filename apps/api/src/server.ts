import { env } from './config/env';
import { createApp } from './app';
import { purgeExpiredSessions } from './core/session';
import { pool } from './db/client';
import { logger } from './lib/logger';
import { installedModules } from './modules/registry';

async function main() {
  const app = await createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(
      { modules: installedModules.map((m) => m.name) },
      `🚀 API listening on http://localhost:${env.PORT}`,
    );
  });

  // Housekeeping: drop expired sessions hourly.
  const cleanup = setInterval(() => purgeExpiredSessions().catch((err) => logger.warn({ err }, 'Session cleanup failed')), 60 * 60 * 1000);
  cleanup.unref();

  const shutdown = (signal: string) => {
    logger.info(`${signal} received, shutting down…`);
    clearInterval(cleanup);
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
