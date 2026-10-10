'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { buttonClasses } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { providerIcons } from './icons';
import { useProviders } from './use-providers';

function Buttons({ mode }: { mode: 'login' | 'register' }) {
  const providers = useProviders();
  const next = useSearchParams().get('next') ?? '/dashboard';
  if (!providers?.length) return null;
  return (
    <div className="space-y-4">
      <Separator label="or" />
      <div className="grid gap-2">
        {providers.map((p) => {
          const Icon = providerIcons[p.id];
          return (
            // Full-page navigation: the API redirects to the provider.
            <a key={p.id} href={`/api/oauth/${p.id}?next=${encodeURIComponent(next)}`} className={buttonClasses('outline', 'md', 'w-full')}>
              {Icon && <Icon className="h-4 w-4" />}
              {mode === 'register' ? 'Sign up' : 'Continue'} with {p.name}
            </a>
          );
        })}
      </div>
    </div>
  );
}

export function SocialButtons(props: { mode: 'login' | 'register' }) {
  return (
    <Suspense>
      <Buttons {...props} />
    </Suspense>
  );
}
