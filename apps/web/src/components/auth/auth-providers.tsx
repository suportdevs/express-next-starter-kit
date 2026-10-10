import { authProviders } from '@/modules/registry';

/**
 * Renders module-provided sign-in options (e.g. social login). Each provider
 * renders its own divider so nothing shows when none are configured.
 */
export function AuthProviders({ mode }: { mode: 'login' | 'register' }) {
  if (authProviders.length === 0) return null;
  return (
    <>
      {authProviders.map((Provider, i) => (
        <Provider key={i} mode={mode} />
      ))}
    </>
  );
}
