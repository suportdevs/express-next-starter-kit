import { Router } from 'express';
import { count, desc, ilike, or } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../db/client';
import { users } from '../../db/schema';
import { serializeUser } from '../../core/user';
import { requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';

export const adminRouter = Router();
adminRouter.use(requireRole('admin'));

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(100).optional(),
});

adminRouter.get('/users', validate(listQuery, 'query'), async (req, res) => {
  const { page, pageSize, q } = req.query as unknown as z.infer<typeof listQuery>;
  const pattern = q ? `%${q.replace(/[%_\\]/g, '\\$&')}%` : undefined;
  const where = pattern ? or(ilike(users.email, pattern), ilike(users.name, pattern)) : undefined;
  const [rows, [total]] = await Promise.all([
    db.select().from(users).where(where).orderBy(desc(users.createdAt)).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ value: count() }).from(users).where(where),
  ]);
  res.json({
    users: await Promise.all(rows.map(serializeUser)),
    pagination: { page, pageSize, total: total?.value ?? 0 },
  });
});
