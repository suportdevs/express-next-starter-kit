# SaaS Starter Kit

Production-ready SaaS foundation: **Express 5 API + Next.js 16 web app + Tailwind 4 + PostgreSQL (Drizzle)**, in a TypeScript monorepo with installable feature modules.

## Features

**Core (always on)**

- **Authentication** — email/password with Argon2id, revocable database sessions in httpOnly cookies, "remember me", sliding expiry, CSRF guard, rate limiting, constant-time login.
- **Brute-force protection** — accounts lock for `LOGIN_LOCKOUT_MINUTES` after `LOGIN_MAX_ATTEMPTS` failures (per account+IP, plus a higher per-account limit), shared across instances. Optional **math captcha** on login, sign-up, password reset and magic-link forms.
- **10 auth page layouts** — `centered`, `split-left`, `split-right`, `fullscreen`, `card`, `youtube-video`, `animated-birds`, `aurora-waves`, `particle-network`, `tidal`. Pick one with `NEXT_PUBLIC_AUTH_LAYOUT`; in development a floating switcher previews them all. Animations respect reduced-motion and adapt to dark/light theme.
- **Email verification modes** — `EMAIL_VERIFICATION=off | optional | required` (required blocks the app and the API until verified).
- **Beautiful emails** — branded HTML templates with preheaders, buttons and one-time-code blocks for verification, reset, OTP, magic links, invitations and a welcome email.
- **Automatic roles** — addresses in `ADMIN_EMAILS` become admins once their email is verified.
- **Account management** — profile, password change, email change (confirmed via link to the new address), active sessions with remote sign-out, account deletion, personal security activity log.
- **Email flows** — verification, password reset, email change, security notifications. Sent through a retrying job queue; printed to the console when SMTP isn't configured.
- **Admin console** (`/admin`) — sign-up analytics, user directory with search and filters, role changes, manual verification, suspend/unsuspend, revoke sessions, delete, and **impersonation** (with a banner and sensitive actions blocked).
- **Audit log** — sign-ins, failed attempts, password/email changes and every admin action, with IP and device. Browsable by admins; users see their own.
- **Background jobs** — Postgres-backed queue (`FOR UPDATE SKIP LOCKED`), retries with exponential backoff, de-duplication keys, and cluster-safe recurring tasks. No Redis needed.
- **Production plumbing** — typed env validation, structured logs with request ids, liveness/readiness probes, graceful shutdown, shared Postgres rate-limit store for multiple instances, security headers, Docker images, CI.
- **Public site** — landing page, Terms and Privacy templates, `robots.txt`, `sitemap.xml`, Open Graph metadata, dark mode.

**Installable modules** (`npm run kit add <name>`)

| Module          | What you get                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------ |
| `two-factor`    | TOTP authenticator-app 2FA with backup codes, enforced on every sign-in method                   |
| `social-auth`   | Google, Facebook, GitHub, X, LinkedIn, Bitbucket, GitLab and Slack (OAuth 2 + PKCE) with account linking |
| `passkeys`      | Passwordless WebAuthn sign-in (Face ID, Touch ID, Windows Hello, security keys)                  |
| `email-otp`     | Two-step sign-in with a 6-digit emailed code, resend cooldown and attempt limits                 |
| `magic-link`    | Passwordless single-use sign-in links by email (optional sign-up)                               |
| `referrals`     | Personal invitation links for every user with automatic sign-up tracking                         |
| `billing`       | Stripe subscriptions: pricing page, checkout, customer portal, webhooks, `requirePlan()` gating  |
| `organizations` | Teams with owner/admin/member roles, email invitations, ownership transfer, `requireOrgRole()`   |

## Quick start

Requirements: Node.js 22 (see `.nvmrc`) and Docker (for Postgres + Mailpit), or your own PostgreSQL 15+.

```bash
npm install
npm run setup        # creates apps/api/.env and apps/web/.env.local with a fresh APP_SECRET
npm run db:up        # Postgres on :5433, Mailpit on :8025
npm run db:migrate
npm run db:seed      # optional: admin@example.com / Admin12345
npm run dev          # web http://localhost:3000 · api http://localhost:4000 · mail http://localhost:8025
```

Add features whenever you need them:

```bash
npm run kit list
npm run kit add billing organizations
npm run db:migrate
```

## Project structure

```
apps/
  api/                  Express API
    src/core/           Public surface for modules: auth flow, sessions, hooks, jobs, audit, tokens
    src/modules/        Built-in routers (auth, users, admin) + installed modules
    src/db/             Drizzle schema, client, migrator, seed
    drizzle/            Generated SQL migrations (commit these)
    test/               Vitest + Supertest integration tests (real Postgres)
  web/                  Next.js App Router
    src/app/(marketing) Landing, legal pages (+ pricing from the billing module)
    src/app/(auth)      Sign in/up, password reset, email verification and confirmation
    src/app/(app)       Signed-in area: dashboard, settings, admin
    src/modules/        Installed web modules + the slot registry
packages/
  shared/               Zod schemas and types shared by API and web
  cli/                  The `kit` CLI and module templates (packages/cli/modules/*)
```

The browser only talks to the Next.js origin: `/api/*` is rewritten to the Express API, so cookies stay first-party and CORS isn't needed.

## Scripts

| Command                              | Description                                        |
| ------------------------------------ | -------------------------------------------------- |
| `npm run dev`                        | API + web with hot reload (the API runs the job worker) |
| `npm run dev:worker`                 | Run a separate job worker (set `RUN_WORKER=false` on the API) |
| `npm run build` / `npm start`        | Production build / start                           |
| `npm run typecheck`                  | Type-check every workspace                         |
| `npm test`                           | API integration tests (uses `TEST_DATABASE_URL`, falls back to `DATABASE_URL`) |
| `npm run db:generate -- --name x`    | Generate a migration after editing a schema        |
| `npm run db:migrate` / `db:studio`   | Apply migrations / open Drizzle Studio             |
| `npm run kit <list\|info\|add\|remove\|sync>` | Manage modules                            |

## How it fits together

### Hooks — extend auth without editing core

Modules register hooks in `setup()` (`apps/api/src/core/hooks.ts`):

- `addLoginGuard` — return a challenge name (e.g. `"two-factor"`) to require an extra step on any sign-in.
- `addUserSerializer` — add fields to the public user (e.g. `twoFactorEnabled`, `plan`).
- `onUserCreated` / `onUserDeleting` — react to account lifecycle (e.g. cancel subscriptions, hand over org ownership).
- `addFeatures` — add fields to `GET /api/features`.

On the web side, modules contribute to fixed **slots** (`apps/web/src/modules/types.ts`): sign-in buttons, Settings → Security cards, settings tabs, sidebar items, public nav links, dashboard widgets and login challenge pages.

### Background jobs

```ts
import { defineJob, schedule } from '../../core';

const sendDigest = defineJob<{ userId: string }>('digest.send', async ({ userId }) => {
  /* … throw to retry with backoff … */
});
await sendDigest.enqueue({ userId }, { delayMs: 60_000, uniqueKey: `digest:${userId}:${day}` });

schedule('reports.nightly', 24 * 60 * 60 * 1000, async () => {
  /* runs once per interval across all instances */
});
```

Built-in schedules purge expired sessions, tokens, rate-limit rows, old jobs and audit entries older than `AUDIT_LOG_RETENTION_DAYS`.

### Audit log

```ts
import { audit } from '../../core';
await audit(req, { action: 'project.deleted', targetType: 'project', targetId: id, metadata: { name } });
```

The actor defaults to the signed-in user; during impersonation the admin's id is recorded in `metadata.impersonatorId`. Add friendly labels in `apps/web/src/lib/audit.ts`.

### Plan and team gating (with the modules installed)

```ts
import { requirePlan } from '../billing';
import { getOrg, requireOrgRole } from '../organizations';

router.get('/reports', requireAuth, requirePlan('pro', 'team'), handler);
router.post('/:org/projects', requireAuth, requireOrgRole('admin'), (req, res) => {
  const { org, role } = getOrg(res);
});
```

## Configuration

API variables live in `apps/api/.env` (see `.env.example` for comments); module variables are appended there automatically by `kit add`.

| Variable                   | Default                 | Notes                                                        |
| -------------------------- | ----------------------- | ------------------------------------------------------------ |
| `DATABASE_URL`             | —                       | Required                                                     |
| `APP_SECRET`               | —                       | Required, 32+ chars. Derives keys for encryption and signing |
| `WEB_URL`                  | `http://localhost:3000` | Public URL used in emails and OAuth/Stripe redirects         |
| `TRUST_PROXY`              | `loopback`              | Hop count (e.g. `1`) behind a load balancer                  |
| `SMTP_*`, `MAIL_FROM`      | —                       | Empty `SMTP_HOST` logs emails instead of sending             |
| `RATE_LIMIT_STORE`         | `memory`                | Use `postgres` when running more than one API instance       |
| `RUN_WORKER`               | `true`                  | Process jobs inside the API process                          |
| `JOB_CONCURRENCY`          | `5`                     | Jobs processed in parallel per worker                        |
| `AUDIT_LOG_RETENTION_DAYS` | `365`                   |                                                              |
| `EMAIL_VERIFICATION`       | `optional`              | `off`, `optional` or `required`                              |
| `LOGIN_MAX_ATTEMPTS`       | `5`                     | Failed sign-ins before a lock; `0` disables lockout           |
| `LOGIN_LOCKOUT_MINUTES`    | `15`                    |                                                              |
| `CAPTCHA_ENABLED` / `CAPTCHA_FORMS` | `false` / all       | Math captcha; forms: `login,register,forgot-password,magic-link` |
| `ADMIN_EMAILS`             | —                       | Comma separated; promoted to admin after verifying           |
| `SEND_WELCOME_EMAIL`       | `true`                  |                                                              |

Web variables (`apps/web/.env.local`): `API_URL` (internal API URL, **needed at build time** for rewrites), `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_AUTH_LAYOUT`, `NEXT_PUBLIC_AUTH_YOUTUBE_ID` (for the `youtube-video` layout) and `NEXT_PUBLIC_AUTH_LAYOUT_SWITCHER`. `NEXT_PUBLIC_*` values are baked in at build time.

## Deployment

```bash
APP_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))") \
WEB_URL=https://app.example.com \
docker compose -f docker-compose.prod.yml up -d --build
```

- The API container runs pending migrations on start. With several replicas, run `node dist/db/migrate.js` as a release step instead.
- Put TLS in front of the `web` service (cookies are `Secure` in production) and set `TRUST_PROXY` to your proxy hop count.
- Health checks: `GET /api/health/live` (process up) and `GET /api/health` (database reachable, 503 otherwise).
- Every response carries `x-request-id`; 500 errors include it so users can quote it to support.
- For heavy job loads, set `RUN_WORKER=false` on the API and start the `worker` profile in `docker-compose.prod.yml`.

### Production checklist

- [ ] Strong `APP_SECRET`, real SMTP credentials and a verified sending domain (SPF/DKIM)
- [ ] Change or delete the seeded admin account
- [ ] Replace the Terms and Privacy templates with reviewed copies
- [ ] `RATE_LIMIT_STORE=postgres` if you run more than one API instance
- [ ] Database backups and log shipping
- [ ] Billing: live Stripe keys, webhook endpoint `https://<WEB_URL>/api/billing/webhook`, Customer Portal enabled

## Writing a module

A module is a folder in `packages/cli/modules/<name>/`:

```
module.json        name, title, description, requires, dependencies, devDependencies, env, notes, migration
files/             mirrored into the project root on install
  apps/api/src/modules/<name>/index.ts    export default defineModule({ name, router, publicRouter?, setup })
  apps/api/src/modules/<name>/schema.ts   Drizzle tables (picked up by drizzle-kit automatically)
  apps/web/src/modules/<name>/index.ts    export default defineWebModule({ name, …slots })
  apps/api/test/<name>.test.ts            tests ship with the module
```

`kit add` copies the files, merges dependencies and env vars, regenerates both registries and generates a migration. `kit remove` reverses it and refuses to delete files you've edited unless you pass `--force`.

Module code imports from `../../core` only. Use `db.select()` for module tables (the relational `db.query` API only knows core tables), and `publicRouter` for webhooks — it is mounted before the CSRF guard and session middleware, with the raw body in `req.rawBody`.

## Security notes

- Session tokens are random 256-bit values; only their SHA-256 is stored. Cookies are `httpOnly`, `SameSite=Lax` and `Secure` in production.
- State-changing requests must send `X-Requested-With` (the web client does); combined with strict CORS this blocks CSRF.
- Single-use tokens (verification, reset, email change, invitations) are hashed at rest and expire.
- Suspending a user revokes all sessions immediately; suspended users can't sign in by any method.
- Impersonation sessions last one hour, never extend, can't target admins, and can't change the password or email or delete the account.
# express-next-starter-kit
