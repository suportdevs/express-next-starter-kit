import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { sql } from 'drizzle-orm';
import { env } from './config/env';
import { hooks } from './core/hooks';
import { db } from './db/client';
import { logger } from './lib/logger';
import { loadSession } from './middleware/auth';
import { csrfGuard } from './middleware/csrf';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { apiLimiter } from './middleware/rate-limit';
import { adminRouter } from './modules/admin/routes';
import { authRouter } from './modules/auth/routes';
import { installedModules } from './modules/registry';
import { usersRouter } from './modules/users/routes';

export async function createApp(): Promise<Express> {
  const app = express();

  const trustProxy = Number(env.TRUST_PROXY);
  app.set('trust proxy', Number.isNaN(trustProxy) ? env.TRUST_PROXY : trustProxy);
  app.disable('x-powered-by');

  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/api/health' } }));
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));
  app.use(cookieParser());

  const api = express.Router();
  api.use(apiLimiter);
  api.use(csrfGuard);
  api.use(loadSession);

  api.get('/health', async (_req, res) => {
    await db.execute(sql`select 1`);
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  api.get('/features', async (_req, res) => {
    const extras = await Promise.all(hooks.featureProviders.map((fn) => fn()));
    res.json(Object.assign({ modules: installedModules.map((m) => m.name) }, ...extras));
  });

  // Modules set up first so their hooks are in place before any request.
  for (const mod of installedModules) {
    await mod.setup?.({ app, hooks, logger: logger.child({ module: mod.name }) });
  }

  api.use('/auth', authRouter);
  api.use('/users', usersRouter);
  api.use('/admin', adminRouter);
  for (const mod of installedModules) {
    if (mod.router) api.use(`/${mod.basePath ?? mod.name}`, mod.router);
  }

  app.use('/api', api);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
