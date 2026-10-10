'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Settings, Shield, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { moduleNavItems } from '@/modules/registry';

interface Item {
  href: string;
  label: string;
  icon?: LucideIcon;
}

export function SidebarNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const items: Item[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...moduleNavItems,
    { href: '/settings', label: 'Settings', icon: Settings },
    ...(isAdmin ? [{ href: '/admin/users', label: 'Admin', icon: Shield }] : []),
  ];
  return (
    <nav className="flex gap-1 md:flex-col">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
