import { installedModules } from './installed';

export { installedModules };

export const authProviders = installedModules.flatMap((m) => m.authProviders ?? []);
export const securitySections = installedModules.flatMap((m) => m.securitySections ?? []);
export const moduleNavItems = installedModules.flatMap((m) => m.navItems ?? []);

const challengeRoutes: Record<string, string> = Object.assign(
  {},
  ...installedModules.map((m) => m.challenges ?? {}),
);

export function challengePath(challenge: string): string {
  return challengeRoutes[challenge] ?? '/login';
}

export const hasModule = (name: string) => installedModules.some((m) => m.name === name);
