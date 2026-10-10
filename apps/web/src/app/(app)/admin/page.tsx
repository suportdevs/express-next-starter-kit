import type { Metadata } from 'next';
import Link from 'next/link';
import type { AdminStats } from '@kit/shared';
import { SignupsChart } from '@/components/admin/signups-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireAdmin, serverFetch } from '@/lib/session';

export const metadata: Metadata = { title: 'Admin' };

export default async function AdminOverviewPage() {
  await requireAdmin();
  const stats = await serverFetch<AdminStats>('/admin/stats');
  if (!stats) throw new Error('Failed to load stats');
  const { users, signups, jobs } = stats;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total users" value={users.total} hint={`+${users.new7d} in the last 7 days`} href="/admin/users" />
        <Stat label="Active users (7d)" value={users.activeUsers7d} hint={`${users.activeSessions} active sessions`} />
        <Stat
          label="Verified"
          value={users.verified}
          hint={users.total ? `${Math.round((users.verified / users.total) * 100)}% of users` : '—'}
          href="/admin/users?status=unverified"
        />
        <Stat label="Suspended" value={users.banned} hint={`${users.admins} admin${users.admins === 1 ? '' : 's'}`} href="/admin/users?status=banned" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sign-ups</CardTitle>
          <CardDescription>{users.new30d} new users in the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <SignupsChart data={signups} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Background jobs</CardTitle>
          <CardDescription>
            {jobs.pending} pending · {jobs.failed} failed
            {jobs.failed > 0 && ' — check the API logs for the failure reason.'}
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

function Stat({ label, value, hint, href }: { label: string; value: number; hint: string; href?: string }) {
  const body = (
    <Card className="h-full p-5 transition-colors hover:border-primary/40">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums">{value.toLocaleString()}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
