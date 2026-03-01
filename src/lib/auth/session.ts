import { headers } from 'next/headers';

import { auth } from '@/lib/auth/better-auth';
import { getCurrentUserRole } from '@/lib/auth/role';
import { syncDomainRoleFromAuthIdentity } from '@/lib/auth/role-sync';
import type { Role } from '@/lib/types';

export type AppSession = {
  isAuthenticated: boolean;
  email?: string;
  name?: string;
  role: Role;
  betterAuthId?: string;
};

function toHeadersObject(input: Headers) {
  return new Headers(input);
}

export async function getSession(): Promise<AppSession> {
  const headerStore = await headers();
  const result = await auth.api.getSession({
    headers: toHeadersObject(headerStore),
  });

  if (!result?.user) {
    return { isAuthenticated: false, role: 'customer' };
  }

  let role =
    (await getCurrentUserRole({
      betterAuthId: result.user.id,
      email: result.user.email,
    })) ?? null;

  if (!role) {
    try {
      const synced = await syncDomainRoleFromAuthIdentity({
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      });
      role = synced.role;
    } catch (error) {
      console.error('role_sync_failed', {
        phase: 'role_sync',
        action: 'session_get',
        email: result.user.email,
        betterAuthId: result.user.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    isAuthenticated: true,
    betterAuthId: result.user.id,
    email: result.user.email,
    name: result.user.name,
    role: role ?? 'customer',
  };
}

export async function clearSession(): Promise<void> {
  const headerStore = await headers();
  await auth.api.signOut({
    headers: toHeadersObject(headerStore),
  });
}
