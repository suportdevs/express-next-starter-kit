import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import type { AppFeatures, Impersonator, PublicUser } from '@kit/shared';
import { challengePath } from '@/modules/registry';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

export interface SessionState {
  user: PublicUser | null;
  challenge: string | null;
  /** Set while an admin is signed in as this user. */
  impersonator?: Impersonator | null;
}

/** Server-side fetch to the API, forwarding the user's cookies. */
export async function serverFetch<T>(path: string): Promise<T | null> {
  const cookieHeader = (await cookies()).toString();
  try {
    const res = await fetch(`${API_URL}/api${path}`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** GET /api/features, de-duplicated per request. */
export const getFeatures = cache(async (): Promise<AppFeatures | null> => serverFetch<AppFeatures>('/features'));

/** Current session, de-duplicated per request. */
export const getSession = cache(async (): Promise<SessionState> => {
  return (await serverFetch<SessionState>('/auth/session')) ?? { user: null, challenge: null };
});

/** Use in admin pages. Unknown to non-admins (404). */
export async function requireAdmin(): Promise<PublicUser> {
  const user = await requireUser();
  if (user.role !== 'admin') notFound();
  return user;
}

/** Use in protected layouts/pages. Redirects to login (or the pending challenge). */
export async function requireUser(): Promise<PublicUser> {
  const { user, challenge } = await getSession();
  if (user) return user;
  if (challenge) redirect(challengePath(challenge));
  redirect('/login');
}

export async function redirectIfAuthenticated() {
  const { user } = await getSession();
  if (user) redirect('/dashboard');
}
