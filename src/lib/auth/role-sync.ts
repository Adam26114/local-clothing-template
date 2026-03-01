import { authRefs, getAuthConvexClient } from '@/lib/auth/convex-auth-client';
import type { AuthIdentity, RoleSyncResult } from '@/lib/auth/types';
import type { Role } from '@/lib/types';

function getSuperAdminEmails() {
  return (process.env.SUPERADMIN_EMAILS ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function isSuperAdminEmail(email: string): boolean {
  return getSuperAdminEmails().includes(email.trim().toLowerCase());
}

export async function syncDomainRoleFromAuthIdentity(
  identity: AuthIdentity & { phone?: string }
): Promise<RoleSyncResult> {
  const client = getAuthConvexClient();
  const role: Role = isSuperAdminEmail(identity.email) ? 'admin' : 'customer';

  const userId = (await client.mutation(authRefs.userUpsertFromAuth, {
    email: identity.email,
    name: identity.name,
    betterAuthId: identity.id,
    phone: identity.phone,
    role,
  })) as string;

  return {
    role,
    betterAuthId: identity.id,
    userId,
  };
}
