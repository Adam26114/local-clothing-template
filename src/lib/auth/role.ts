import { authRefs, getAuthConvexClient } from '@/lib/auth/convex-auth-client';
import type { Role, User } from '@/lib/types';

export async function getCurrentUserRole(input: {
  betterAuthId?: string;
  email?: string;
}): Promise<Role | null> {
  const client = getAuthConvexClient();

  if (input.betterAuthId) {
    const byBetterAuth = (await client.query(authRefs.userByBetterAuthId, {
      betterAuthId: input.betterAuthId,
    })) as User | null;

    if (byBetterAuth?.role) {
      return byBetterAuth.role;
    }
  }

  if (input.email) {
    const byEmail = (await client.query(authRefs.userByEmail, {
      email: input.email,
    })) as User | null;

    if (byEmail?.role) {
      return byEmail.role;
    }
  }

  return null;
}
