import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { PublicUser } from '@kit/shared';
import { PageHeader } from '@/components/app/page-header';
import { Avatar } from '@/components/app/user-menu';
import { Badge } from '@/components/ui/badge';
import { buttonClasses } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { requireUser, serverFetch } from '@/lib/session';

export const metadata: Metadata = { title: 'Users' };

interface UsersResponse {
  users: PublicUser[];
  pagination: { page: number; pageSize: number; total: number };
}

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const me = await requireUser();
  if (me.role !== 'admin') notFound();

  const { q = '', page = '1' } = await searchParams;
  const qs = new URLSearchParams({ page, ...(q ? { q } : {}) });
  const data = await serverFetch<UsersResponse>(`/admin/users?${qs}`);
  if (!data) throw new Error('Failed to load users');
  const { users, pagination } = data;
  const pages = Math.max(1, Math.ceil(pagination.total / pagination.pageSize));
  const link = (p: number) => `/admin/users?${new URLSearchParams({ page: String(p), ...(q ? { q } : {}) })}`;

  return (
    <>
      <PageHeader title="Users" description={`${pagination.total} registered users`} />
      <form className="mb-4 max-w-sm">
        <Input name="q" defaultValue={q} placeholder="Search by name or email…" />
      </form>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar user={u} />
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={u.role === 'admin' ? 'primary' : 'default'}>{u.role}</Badge>
                </td>
                <td className="px-4 py-3">
                  {u.emailVerified ? <Badge variant="success">Verified</Badge> : <Badge>Unverified</Badge>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {pagination.page} of {pages}
          </span>
          <div className="flex gap-2">
            {pagination.page > 1 && (
              <Link href={link(pagination.page - 1)} className={buttonClasses('outline', 'sm')}>
                Previous
              </Link>
            )}
            {pagination.page < pages && (
              <Link href={link(pagination.page + 1)} className={buttonClasses('outline', 'sm')}>
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
