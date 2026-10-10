import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { PublicUser } from '@kit/shared';

export interface NavItem {
  href: string;
  label: string;
  icon?: LucideIcon;
}

/**
 * Contract between the web app and an installed module. The app renders
 * these contributions at fixed "slots", so modules never edit core pages.
 */
export interface WebModule {
  name: string;
  /** Rendered under the login / register forms (e.g. "Continue with Google"). */
  authProviders?: ComponentType<{ mode: 'login' | 'register' }>[];
  /** Cards rendered on Settings → Security. */
  securitySections?: ComponentType<{ user: PublicUser }>[];
  /** Maps an API challenge (returned by login) to the page that resolves it. */
  challenges?: Record<string, string>;
  /** Extra items in the app sidebar. */
  navItems?: NavItem[];
}

export const defineWebModule = (mod: WebModule): WebModule => mod;
