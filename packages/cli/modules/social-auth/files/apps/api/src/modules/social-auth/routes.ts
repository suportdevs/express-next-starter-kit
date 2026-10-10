import type { Request, Response } from 'express';
import { Router } from 'express';
import passport from 'passport';
import {
  badRequest,
  env,
  isProd,
  logger,
  notFound,
  randomToken,
  requireAuth,
  safeEqual,
  sign,
  signIn,
} from '../../core';
import { providers, type OAuthProfile } from './providers';
import { OAuthError, findOrCreateUser, linkAccount, listAccounts, unlinkAccount } from './service';

export const router = Router();
router.use(passport.initialize());

const STATE_COOKIE = 'oauth_state';
const STATE_PURPOSE = 'oauth-state';

interface OAuthState {
  state: string;
  next: string;
  mode: 'login' | 'link';
}

const safeNext = (v: unknown, fallback: string) =>
  typeof v === 'string' && v.startsWith('/') && !v.startsWith('//') ? v : fallback;

const webRedirect = (res: Response, path: string) => res.redirect(`${env.WEB_URL}${path}`);

function writeState(res: Response, data: OAuthState) {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  res.cookie(STATE_COOKIE, `${payload}.${sign(payload, STATE_PURPOSE)}`, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax', // must survive the top-level redirect back from the provider
    maxAge: 10 * 60 * 1000,
    path: '/api/oauth',
  });
}

function readState(req: Request, res: Response): OAuthState | null {
  const raw = req.cookies?.[STATE_COOKIE];
  res.clearCookie(STATE_COOKIE, { path: '/api/oauth' });
  if (typeof raw !== 'string') return null;
  const [payload, sig] = raw.split('.');
  if (!payload || !sig || !safeEqual(sig, sign(payload, STATE_PURPOSE))) return null;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()) as OAuthState;
  } catch {
    return null;
  }
}

router.get('/providers', (_req, res) => {
  res.json({ providers: [...providers.values()].map(({ id, name }) => ({ id, name })) });
});

router.get('/accounts', requireAuth, async (req, res) => {
  res.json({ accounts: await listAccounts(req.auth!.user.id) });
});

router.delete('/accounts/:provider', requireAuth, async (req, res) => {
  try {
    if (!(await unlinkAccount(req.auth!.user, String(req.params.provider)))) throw notFound('Account not linked');
  } catch (err) {
    if (err instanceof OAuthError && err.code === 'last_login_method') {
      throw badRequest('Set a password before disconnecting your only sign-in method', 'LAST_LOGIN_METHOD');
    }
    throw err;
  }
  res.status(204).end();
});

/** Starts the OAuth dance: /api/oauth/google?next=/dashboard[&mode=link] */
router.get('/:provider', (req, res, next) => {
  const provider = providers.get(String(req.params.provider));
  if (!provider) throw notFound('Unknown or unconfigured provider');

  const mode = req.query.mode === 'link' ? 'link' : 'login';
  if (mode === 'link' && (!req.auth || req.auth.session.pending)) return webRedirect(res, '/login');

  const state = randomToken(16);
  writeState(res, { state, mode, next: safeNext(req.query.next, mode === 'link' ? '/settings/security' : '/dashboard') });
  passport.authenticate(provider.id, { session: false, scope: provider.scope, state })(req, res, next);
});

router.get('/:provider/callback', (req, res, next) => {
  const provider = providers.get(String(req.params.provider));
  if (!provider) throw notFound('Unknown or unconfigured provider');

  const saved = readState(req, res);
  const returned = typeof req.query.state === 'string' ? req.query.state : '';
  if (!saved || !returned || !safeEqual(saved.state, returned)) {
    return webRedirect(res, '/login?error=oauth_failed');
  }

  passport.authenticate(provider.id, { session: false }, async (err: unknown, profile: OAuthProfile | false) => {
    const failPath = saved.mode === 'link' ? '/settings/security?error=' : '/login?error=';
    try {
      if (err || !profile) {
        if (err) logger.warn({ err, provider: provider.id }, 'OAuth callback failed');
        return webRedirect(res, `${failPath}oauth_failed`);
      }

      if (saved.mode === 'link') {
        if (!req.auth || req.auth.session.pending) return webRedirect(res, '/login');
        await linkAccount(req.auth.user.id, profile);
        return webRedirect(res, `${saved.next}${saved.next.includes('?') ? '&' : '?'}linked=${provider.id}`);
      }

      const user = await findOrCreateUser(profile);
      await signIn(req, res, user, { method: `oauth:${provider.id}` });
      // If a challenge (e.g. 2FA) is pending, the web app redirects to it.
      return webRedirect(res, saved.next);
    } catch (e) {
      if (e instanceof OAuthError) return webRedirect(res, `${failPath}${e.code}`);
      next(e);
    }
  })(req, res, next);
});
