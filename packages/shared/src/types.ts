export type UserRole = 'user' | 'admin';

/**
 * The user shape returned by the API. Modules may attach extra fields
 * (e.g. `twoFactorEnabled`) through the API's user serializer hook,
 * which is why the index signature exists.
 */
export interface PublicUser {
  id: string;
  email: string;
  name: string;
  image: string | null;
  role: UserRole;
  emailVerified: boolean;
  hasPassword: boolean;
  createdAt: string;
  [extra: string]: unknown;
}

export interface SessionInfo {
  id: string;
  userAgent: string | null;
  ip: string | null;
  createdAt: string;
  lastSeenAt: string;
  current: boolean;
}

/** Returned by login when a module (e.g. two-factor) requires an extra step. */
export interface AuthChallengeResponse {
  challenge: string;
}

export interface LoginSuccessResponse {
  user: PublicUser;
}

export type LoginResponse = LoginSuccessResponse | AuthChallengeResponse;

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface AppFeatures {
  /** Installed module names, e.g. ["two-factor", "social-auth"]. */
  modules: string[];
  [extra: string]: unknown;
}
