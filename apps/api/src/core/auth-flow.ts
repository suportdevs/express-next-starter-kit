import type { Request, Response } from 'express';
import type { LoginResponse } from '@kit/shared';
import type { User } from '../db/schema';
import { hooks } from './hooks';
import { completeSessionChallenge, createSession, setSessionCookie } from './session';
import { serializeUser } from './user';

/**
 * The single entry point for signing a user in — used by password login,
 * social login and any future method. Login guards (e.g. two-factor) may turn
 * the session into a pending one that requires an extra step.
 */
export async function signIn(
  req: Request,
  res: Response,
  user: User,
  opts: { method: string; persistent?: boolean },
): Promise<LoginResponse> {
  const challenge = await hooks.runLoginGuards({ user, req, method: opts.method });
  const { token, session } = await createSession(req, user.id, {
    persistent: opts.persistent,
    pending: challenge,
  });
  setSessionCookie(res, token, session);
  if (challenge) return { challenge };
  return { user: await serializeUser(user) };
}

/** Call after a module verifies its challenge (e.g. a valid TOTP code). */
export async function completeChallenge(req: Request, res: Response): Promise<LoginResponse> {
  const auth = req.auth!;
  const session = await completeSessionChallenge(auth.session.id);
  setSessionCookie(res, auth.token, session);
  return { user: await serializeUser(auth.user) };
}
