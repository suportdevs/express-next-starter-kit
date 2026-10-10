import Link from 'next/link';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { buttonClasses } from '@/components/ui/button';
import { getSession } from '@/lib/session';
import { publicNavItems } from '@/modules/registry';

export async function SiteHeader() {
  const { user } = await getSession();
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
      <div className="flex items-center gap-8">
        <Logo />
        <nav className="hidden gap-6 text-sm text-muted-foreground sm:flex">
          {publicNavItems.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <nav className="flex items-center gap-2">
        <ThemeToggle />
        {user ? (
          <Link href="/dashboard" className={buttonClasses('primary', 'sm')}>
            Dashboard
          </Link>
        ) : (
          <>
            <Link href="/login" className={buttonClasses('ghost', 'sm')}>
              Sign in
            </Link>
            <Link href="/register" className={buttonClasses('primary', 'sm')}>
              Get started
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
