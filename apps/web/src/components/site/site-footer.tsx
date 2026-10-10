import Link from 'next/link';
import { appName } from '@/lib/utils';
import { publicNavItems } from '@/modules/registry';

export function SiteFooter() {
  const links = [...publicNavItems, { href: '/terms', label: 'Terms' }, { href: '/privacy', label: 'Privacy' }];
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} {appName}. All rights reserved.
        </p>
        <nav className="flex flex-wrap gap-5">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
