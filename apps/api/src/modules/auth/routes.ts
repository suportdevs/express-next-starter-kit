import { Router } from 'express';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
  type SessionInfo,
  type VerifyEmailInput,
} from '@kit/shared';
import { signIn } from '../../core/auth-flow';
import { clearSessionCookie, deleteSession, deleteUserSessions, listUserSessions } from '../../core/session';
import { serializeUser } from '../../core/user';
import { badRequest, notFound, unauthorized } from '../../lib/errors';
import { requireAuth } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rate-limit';
import { validate } from '../../middleware/validate';
import * as auth from './service';

export const authRouter = Router();

authRouter.post('/register', authLimiter, validate(registerSchema), async (req, res) => {
  const input = req.body as RegisterInput;
  const user = await auth.registerUser(input);
  const result = await signIn(req, res, user, { method: 'password' });
  res.status(201).json(result);
});

authRouter.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
  const { email, password, remember } = req.body as LoginInput;
  const user = await auth.authenticate(email, password);
  if (!user) throw unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  res.json(await signIn(req, res, user, { method: 'password', persistent: remember ?? true }));
});

authRouter.post('/logout', async (req, res) => {
  if (req.auth) await deleteSession(req.auth.session.id);
  clearSessionCookie(res);
  res.status(204).end();
});

/** Always 200 — tells the client whether it's signed in, or mid-challenge. */
authRouter.get('/session', async (req, res) => {
  if (!req.auth) return res.json({ user: null, challenge: null });
  if (req.auth.session.pending) return res.json({ user: null, challenge: req.auth.session.pending });
  res.json({ user: await serializeUser(req.auth.user), challenge: null });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  res.json({ user: await serializeUser(req.auth!.user) });
});

authRouter.post('/verify-email', authLimiter, validate(verifyEmailSchema), async (req, res) => {
  const { token } = req.body as VerifyEmailInput;
  if (!(await auth.verifyEmail(token))) {
    throw badRequest('This verification link is invalid or has expired', 'INVALID_TOKEN');
  }
  res.json({ ok: true });
});

authRouter.post('/verify-email/resend', requireAuth, authLimiter, async (req, res) => {
  await auth.sendEmailVerification(req.auth!.user);
  res.json({ ok: true });
});

authRouter.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), async (req, res) => {
  const { email } = req.body as ForgotPasswordInput;
  await auth.requestPasswordReset(email);
  res.json({ ok: true });
});

authRouter.post('/reset-password', authLimiter, validate(resetPasswordSchema), async (req, res) => {
  const { token, password } = req.body as ResetPasswordInput;
  if (!(await auth.resetPassword(token, password))) {
    throw badRequest('This reset link is invalid or has expired', 'INVALID_TOKEN');
  }
  clearSessionCookie(res);
  res.json({ ok: true });
});

authRouter.get('/sessions', requireAuth, async (req, res) => {
  const current = req.auth!.session.id;
  const rows = await listUserSessions(req.auth!.user.id);
  const sessions: SessionInfo[] = rows
    .filter((s) => !s.pending)
    .map((s) => ({
      id: s.id,
      userAgent: s.userAgent,
      ip: s.ip,
      createdAt: s.createdAt.toISOString(),
      lastSeenAt: s.lastSeenAt.toISOString(),
      current: s.id === current,
    }));
  res.json({ sessions });
});

authRouter.delete('/sessions', requireAuth, async (req, res) => {
  await deleteUserSessions(req.auth!.user.id, req.auth!.session.id);
  res.status(204).end();
});

authRouter.delete('/sessions/:id', requireAuth, async (req, res) => {
  const sessions = await listUserSessions(req.auth!.user.id);
  const target = sessions.find((s) => s.id === req.params.id);
  if (!target) throw notFound('Session not found');
  await deleteSession(target.id);
  if (target.id === req.auth!.session.id) clearSessionCookie(res);
  res.status(204).end();
});
