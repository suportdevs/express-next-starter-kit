import { Router } from 'express';
import { eq } from 'drizzle-orm';
import {
  changePasswordSchema,
  deleteAccountSchema,
  updateProfileSchema,
  type ChangePasswordInput,
  type DeleteAccountInput,
  type UpdateProfileInput,
} from '@kit/shared';
import { db } from '../../db/client';
import { users } from '../../db/schema';
import { hooks } from '../../core/hooks';
import { clearSessionCookie, deleteUserSessions } from '../../core/session';
import { serializeUser } from '../../core/user';
import { badRequest } from '../../lib/errors';
import { hashPassword, verifyPassword } from '../../lib/password';
import { requireAuth } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rate-limit';
import { validate } from '../../middleware/validate';
import { sendPasswordChangedEmail } from '../auth/emails';

export const usersRouter = Router();
usersRouter.use(requireAuth);

usersRouter.patch('/me', validate(updateProfileSchema), async (req, res) => {
  const { name } = req.body as UpdateProfileInput;
  const [user] = await db.update(users).set({ name }).where(eq(users.id, req.auth!.user.id)).returning();
  res.json({ user: await serializeUser(user!) });
});

usersRouter.post('/me/password', authLimiter, validate(changePasswordSchema), async (req, res) => {
  const { currentPassword, newPassword } = req.body as ChangePasswordInput;
  const { user, session } = req.auth!;
  if (user.passwordHash) {
    if (!currentPassword || !(await verifyPassword(user.passwordHash, currentPassword))) {
      throw badRequest('Current password is incorrect', 'INVALID_PASSWORD');
    }
  }
  await db.update(users).set({ passwordHash: await hashPassword(newPassword) }).where(eq(users.id, user.id));
  await deleteUserSessions(user.id, session.id);
  await sendPasswordChangedEmail(user.email, user.name);
  res.json({ ok: true });
});

usersRouter.delete('/me', authLimiter, validate(deleteAccountSchema), async (req, res) => {
  const { password } = req.body as DeleteAccountInput;
  const { user } = req.auth!;
  if (user.passwordHash && !(password && (await verifyPassword(user.passwordHash, password)))) {
    throw badRequest('Password is incorrect', 'INVALID_PASSWORD');
  }
  await hooks.emit(hooks.userDeleting, user);
  await db.delete(users).where(eq(users.id, user.id)); // sessions & module rows cascade
  clearSessionCookie(res);
  res.status(204).end();
});
