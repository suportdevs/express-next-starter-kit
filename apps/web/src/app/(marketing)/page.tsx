import Link from 'next/link';
import { ArrowRight, KeyRound, Mail, Puzzle, ShieldCheck, Terminal, Users } from 'lucide-react';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { buttonClasses } from '@/components/ui/button';
import { getSession } from '@/lib/session';

const features = [
  { icon: KeyRound, title: 'Secure authentication', text: 'Argon2id passwords, revocable DB sessions, httpOnly cookies, CSRF & rate limiting.' },
  { icon: Mail, title: 'Email flows', text: 'Verification, password reset and security notifications out of the box.' },
  { icon: Puzzle, title: 'Installable modules', text: 'Add two-factor auth, social login and more with a single CLI command.' },
  { icon: ShieldCheck, title: 'Production ready', text: 'Typed env, structured logging, graceful shutdown, health checks, migrations.' },
  { icon: Users, title: 'Roles & admin', text: 'Role based access control and an admin user directory.' },
  { icon: Terminal, title: 'Great DX', text: 'TypeScript end to end, shared validation schemas, one command to run it all.' },
];

export default async function HomePage() {
  const { user } = await getSession();
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
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

      <main className="mx-auto max-w-6xl px-6">
        <section className="py-20 text-center sm:py-28">
          <span className="inline-flex items-center rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
            Express · Next.js · Tailwind · PostgreSQL
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            Ship your SaaS <span className="text-primary">this weekend</span>, not next quarter.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            A production-grade starter kit with authentication, account management and a modular
            architecture you can extend from the command line.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/register" className={buttonClasses('primary', 'lg')}>
              Create an account <ArrowRight className="h-4 w-4" />
            </Link>
            <code className="flex h-11 items-center rounded-lg border bg-card px-4 font-mono text-sm text-muted-foreground">
              npm run kit add two-factor
            </code>
          </div>
        </section>

        <section className="grid gap-4 pb-24 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border bg-card p-6">
              <Icon className="h-5 w-5 text-primary" />
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
