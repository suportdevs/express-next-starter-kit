import Link from 'next/link';
import { ArrowRight, Building2, CreditCard, KeyRound, Mail, Puzzle, ScrollText, ShieldCheck, Terminal, Users } from 'lucide-react';
import { buttonClasses } from '@/components/ui/button';

const features = [
  { icon: KeyRound, title: 'Secure authentication', text: 'Argon2id passwords, revocable DB sessions, httpOnly cookies, CSRF & rate limiting.' },
  { icon: Mail, title: 'Email flows', text: 'Verification, password reset, email change and security notifications — sent via a retrying job queue.' },
  { icon: Users, title: 'Admin console', text: 'User directory, roles, suspensions, impersonation and sign-up analytics.' },
  { icon: ScrollText, title: 'Audit log', text: 'Every sign-in and sensitive change is recorded, for admins and for users themselves.' },
  { icon: CreditCard, title: 'Billing', text: 'Stripe subscriptions, checkout and customer portal — install with one command.' },
  { icon: Building2, title: 'Teams', text: 'Organizations with roles and email invitations — install with one command.' },
  { icon: Puzzle, title: 'Installable modules', text: 'Two-factor auth, social login, billing and teams via the kit CLI.' },
  { icon: ShieldCheck, title: 'Production ready', text: 'Typed env, structured logs with request ids, health probes, graceful shutdown, Docker.' },
  { icon: Terminal, title: 'Great DX', text: 'TypeScript end to end, shared validation schemas, one command to run it all.' },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <section className="py-20 text-center sm:py-28">
        <span className="inline-flex items-center rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
          Express · Next.js · Tailwind · PostgreSQL
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          Ship your SaaS <span className="text-primary">this weekend</span>, not next quarter.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          A production-grade starter kit with authentication, billing, teams, an admin console and a modular architecture
          you can extend from the command line.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/register" className={buttonClasses('primary', 'lg')}>
            Create an account <ArrowRight className="h-4 w-4" />
          </Link>
          <code className="flex h-11 items-center rounded-lg border bg-card px-4 font-mono text-sm text-muted-foreground">
            npm run kit add billing
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
    </div>
  );
}
