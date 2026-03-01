import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';

import { convexBetterAuthAdapter } from '@/lib/auth/better-auth/convex-adapter';

const baseUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000';

export const auth = betterAuth({
  baseURL: baseUrl,
  secret: process.env.BETTER_AUTH_SECRET ?? 'dev-only-secret-change-me-before-production-32-chars',
  database: convexBetterAuthAdapter(),
  plugins: [nextCookies()],
  emailAndPassword: {
    enabled: true,
  },
  user: {
    modelName: 'authUsers',
  },
  session: {
    modelName: 'authSessions',
    expiresIn: 60 * 60 * 24 * 7,
  },
  account: {
    modelName: 'authAccounts',
  },
  verification: {
    modelName: 'authVerificationTokens',
  },
});
