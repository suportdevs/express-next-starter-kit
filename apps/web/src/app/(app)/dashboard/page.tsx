import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, Circle } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireUser } from '@/lib/session';
import { installedModules } from '@/modules/registry';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const user = await requireUser();
  const checklist = [
    { done: true, label: 'Create your account' },
    { done: user.emailVerified, label: 'Verify your email address' },
    ...(installedModules.some((m) => m.name === 'two-factor')
      ? [{ done: Boolean(user.twoFactorEnabled), label: 'Enable two-factor authentication', href: '/settings/security' }]
      : []),
  ];

  return (
    <>
      <PageHeader title={`Welcome, ${user.name.split(' ')[0]} 👋`} description="Here's what's happening with your account." />
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Plan" value="Free" />
        <Stat label="Member since" value={new Date(user.createdAt).toLocaleDateString()} />
        <Stat label="Role" value={user.role === 'admin' ? 'Administrator' : 'Member'} />
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Getting started</CardTitle>
          <CardDescription>Finish setting up your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {checklist.map((item) => (
              <li key={item.label} className="flex items-center gap-3 text-sm">
                {item.done ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                {'href' in item && item.href && !item.done ? (
                  <Link href={item.href} className="text-primary hover:underline">
                    {item.label}
                  </Link>
                ) : (
                  <span className={item.done ? 'text-muted-foreground line-through' : ''}>{item.label}</span>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </Card>
  );
}
