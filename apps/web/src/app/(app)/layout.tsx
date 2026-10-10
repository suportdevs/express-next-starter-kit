import { Logo } from '@/components/logo';
import { SidebarNav } from '@/components/app/sidebar-nav';
import { UserMenu } from '@/components/app/user-menu';
import { VerifyEmailBanner } from '@/components/app/verify-email-banner';
import { ThemeToggle } from '@/components/theme-toggle';
import { requireUser } from '@/lib/session';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="hidden bg-card px-4 py-4 md:sticky md:top-0 md:block md:h-screen md:border-r">
        <Logo href="/dashboard" className="mb-6 px-2" />
        <SidebarNav isAdmin={user.role === 'admin'} />
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-card/60 px-6 backdrop-blur">
          <Logo href="/dashboard" className="md:hidden" />
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <UserMenu user={user} />
          </div>
        </header>
        <div className="overflow-x-auto border-b bg-card px-4 py-2 md:hidden">
          <SidebarNav isAdmin={user.role === 'admin'} />
        </div>
        {!user.emailVerified && <VerifyEmailBanner email={user.email} />}
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
