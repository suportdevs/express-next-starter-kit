import passport from 'passport';
import { Strategy as GitHubStrategy, type Profile as GitHubProfile } from 'passport-github2';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { z } from 'zod';
import { env, parseModuleEnv } from '../../core';

/** Provider-agnostic identity returned by every strategy. */
export interface OAuthProfile {
  provider: string;
  id: string;
  email: string | null;
  emailVerified: boolean;
  name: string;
  image: string | null;
}

export interface ProviderConfig {
  id: string;
  name: string;
  scope: string[];
}

const config = parseModuleEnv(
  'social-auth',
  z.object({
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    OAUTH_REDIRECT_BASE_URL: z.string().optional(),
  }),
);

const callbackURL = (provider: string) =>
  `${(config.OAUTH_REDIRECT_BASE_URL || env.WEB_URL).replace(/\/$/, '')}/api/oauth/${provider}/callback`;

export const providers = new Map<string, ProviderConfig>();

/** Registers a Passport strategy for every provider that has credentials configured. */
export function registerStrategies() {
  if (config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET) {
    passport.use(
      'google',
      new GoogleStrategy(
        {
          clientID: config.GOOGLE_CLIENT_ID,
          clientSecret: config.GOOGLE_CLIENT_SECRET,
          callbackURL: callbackURL('google'),
        },
        (_accessToken, _refreshToken, profile, done) => {
          const email = profile.emails?.[0];
          done(null, {
            provider: 'google',
            id: profile.id,
            email: email?.value?.toLowerCase() ?? null,
            emailVerified: Boolean(email && (email as { verified?: boolean | string }).verified !== false),
            name: profile.displayName || email?.value?.split('@')[0] || 'User',
            image: profile.photos?.[0]?.value ?? null,
          } satisfies OAuthProfile);
        },
      ),
    );
    providers.set('google', { id: 'google', name: 'Google', scope: ['profile', 'email'] });
  }

  if (config.GITHUB_CLIENT_ID && config.GITHUB_CLIENT_SECRET) {
    passport.use(
      'github',
      new GitHubStrategy(
        {
          clientID: config.GITHUB_CLIENT_ID,
          clientSecret: config.GITHUB_CLIENT_SECRET,
          callbackURL: callbackURL('github'),
          scope: ['read:user', 'user:email'],
          allRawEmails: true, // includes `verified` / `primary` flags
        },
        (_accessToken: string, _refreshToken: string, profile: GitHubProfile, done: (err: unknown, user?: OAuthProfile) => void) => {
          type GhEmail = { value: string; primary?: boolean; verified?: boolean };
          const emails = (profile.emails ?? []) as GhEmail[];
          const email = emails.find((e) => e.primary && e.verified) ?? emails.find((e) => e.verified);
          done(null, {
            provider: 'github',
            id: String(profile.id),
            email: email?.value?.toLowerCase() ?? null,
            emailVerified: Boolean(email?.verified),
            name: profile.displayName || profile.username || 'User',
            image: profile.photos?.[0]?.value ?? null,
          });
        },
      ),
    );
    providers.set('github', { id: 'github', name: 'GitHub', scope: ['read:user', 'user:email'] });
  }
}
