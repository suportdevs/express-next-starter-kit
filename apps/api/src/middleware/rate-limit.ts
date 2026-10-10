import { rateLimit, type Options } from 'express-rate-limit';
import type { ApiErrorBody } from '@kit/shared';
import { isProd, isTest } from '../config/env';

/**
 * In-memory rate limiter. For multiple API instances, plug in a shared store
 * (e.g. `rate-limit-redis`) via the `store` option.
 */
export function limiter(opts: Partial<Options> & { windowMs: number; limit: number }) {
  return rateLimit({
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => isTest,
    handler: (_req, res, _next, options) => {
      const body: ApiErrorBody = {
        error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' },
      };
      res.status(options.statusCode).json(body);
    },
    ...opts,
  });
}

/** Strict limiter for credential endpoints (login, register, reset). */
export const authLimiter = limiter({ windowMs: 15 * 60 * 1000, limit: isProd ? 20 : 500 });
/** General API limiter. */
export const apiLimiter = limiter({ windowMs: 60 * 1000, limit: 300 });
