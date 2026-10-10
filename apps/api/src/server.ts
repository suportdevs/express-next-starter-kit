import { env } from './config/env';
import { createApp } from './app';
import { worker } from './core/jobs';
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
  // Keep-alive must outlive the load balancer's idle timeout to avoid 502s.
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;

  if (env.RUN_WORKER) worker.start();

  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`${signal} received, shutting down…`);
    setTimeout(() => process.exit(1), 10_000).unref();
    server.close(async () => {
      await worker.stop();
      await pool.end();
      process.exit(0);
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

process.on('unhandledRejection', (err) => logger.error({ err }, 'Unhandled promise rejection'));

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
