import { eq } from 'drizzle-orm';
import { hashPassword } from '../lib/password';
import { db, pool } from './client';
import { users } from './schema';

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin12345';

async function main() {
  const existing = await db.query.users.findFirst({ where: eq(users.email, ADMIN_EMAIL) });
  if (existing) {
    console.log(`ℹ️  Admin ${ADMIN_EMAIL} already exists — skipping`);
    return;
  }
  await db.insert(users).values({
    email: ADMIN_EMAIL,
    name: 'Admin',
    role: 'admin',
    passwordHash: await hashPassword(ADMIN_PASSWORD),
    emailVerifiedAt: new Date(),
  });
  console.log(`✅ Created admin ${ADMIN_EMAIL} / ${ADMIN_PASSWORD} — change this password!`);
}

main()
  .catch((err) => {
    console.error('❌ Seed failed', err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
