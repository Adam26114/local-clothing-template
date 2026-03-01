'use server';

import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { authRefs, getAuthConvexClient } from '@/lib/auth/convex-auth-client';
import { auth } from '@/lib/auth/better-auth';
import { syncDomainRoleFromAuthIdentity } from '@/lib/auth/role-sync';
import { clearSession } from '@/lib/auth/session';
import type { Role } from '@/lib/types';

function normalizeEmail(value: FormDataEntryValue | null): string {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function normalizeText(value: FormDataEntryValue | null): string {
  return String(value ?? '').trim();
}

function getHeaderStore() {
  return headers().then((value) => new Headers(value));
}

function isSafeNextPath(next: string): boolean {
  return next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/auth');
}

function resolveDestinationByRole(role: Role, next?: string): string {
  if (next && isSafeNextPath(next)) {
    if (next.startsWith('/admin')) {
      return role === 'admin' ? next : '/account';
    }
    return next;
  }

  return role === 'admin' ? '/admin' : '/account';
}

function classifyAuthError(error: unknown): 'conflict' | 'invalid' | 'server' {
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : typeof error === 'string'
        ? error.toLowerCase()
        : JSON.stringify(error).toLowerCase();

  if (!message) {
    return 'server';
  }

  if (
    message.includes('already') ||
    message.includes('exists') ||
    message.includes('duplicate') ||
    message.includes('conflict')
  ) {
    return 'conflict';
  }

  if (
    message.includes('invalid') ||
    message.includes('credential') ||
    message.includes('password') ||
    message.includes('not found')
  ) {
    return 'invalid';
  }

  return 'server';
}

async function authUserExistsByEmail(email: string): Promise<boolean> {
  try {
    const client = getAuthConvexClient();
    const user = await client.query(authRefs.authFindOne, {
      model: 'authUsers',
      where: [{ field: 'email', operator: 'eq', value: email, connector: 'AND' }],
    });
    return Boolean(user);
  } catch {
    return false;
  }
}

async function ensureDomainUserForExistingAuth(email: string): Promise<void> {
  try {
    const client = getAuthConvexClient();
    const authUser = (await client.query(authRefs.authFindOne, {
      model: 'authUsers',
      where: [{ field: 'email', operator: 'eq', value: email, connector: 'AND' }],
      select: ['id', 'email', 'name'],
    })) as { id?: unknown; email?: unknown; name?: unknown } | null;

    if (
      !authUser ||
      typeof authUser.id !== 'string' ||
      typeof authUser.email !== 'string' ||
      typeof authUser.name !== 'string'
    ) {
      return;
    }

    await syncDomainRoleFromAuthIdentity({
      id: authUser.id,
      email: authUser.email,
      name: authUser.name,
    });
  } catch (error) {
    console.error('role_sync_failed', {
      phase: 'role_sync',
      action: 'register_conflict_reconcile',
      email,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function loginAction(formData: FormData) {
  const email = normalizeEmail(formData.get('email'));
  const password = normalizeText(formData.get('password'));
  const next = normalizeText(formData.get('next'));

  if (!email || !password) {
    redirect('/auth/login?error=missing');
  }

  let destination = '/auth/login?error=server';

  let response: Awaited<ReturnType<typeof auth.api.signInEmail>>;
  try {
    response = await auth.api.signInEmail({
      body: {
        email,
        password,
        rememberMe: true,
      },
      headers: await getHeaderStore(),
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    const errorType = classifyAuthError(error);
    destination = `/auth/login?error=${errorType}`;
    redirect(destination);
  }

  try {
    const roleResult = await syncDomainRoleFromAuthIdentity({
      id: response.user.id,
      email: response.user.email,
      name: response.user.name,
    });

    destination = resolveDestinationByRole(roleResult.role, next);
  } catch (error) {
    console.error('role_sync_failed', {
      phase: 'role_sync',
      action: 'login',
      email: response.user.email,
      betterAuthId: response.user.id,
      error: error instanceof Error ? error.message : String(error),
    });
    destination = resolveDestinationByRole('customer', next);
  }

  redirect(destination);
}

export async function registerAction(formData: FormData) {
  const name = normalizeText(formData.get('name'));
  const email = normalizeEmail(formData.get('email'));
  const password = normalizeText(formData.get('password'));

  if (!name || !email || !password) {
    redirect('/auth/register?error=missing');
  }

  let destination = '/auth/register?error=server';

  let response: Awaited<ReturnType<typeof auth.api.signUpEmail>>;
  try {
    response = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
      headers: await getHeaderStore(),
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    const errorType = classifyAuthError(error);
    if (errorType === 'conflict') {
      await ensureDomainUserForExistingAuth(email);
      destination = `/auth/login?error=exists&email=${encodeURIComponent(email)}`;
    } else if (errorType === 'server' && (await authUserExistsByEmail(email))) {
      await ensureDomainUserForExistingAuth(email);
      destination = `/auth/login?error=exists&email=${encodeURIComponent(email)}`;
    } else {
      destination = `/auth/register?error=${errorType}`;
    }
    redirect(destination);
  }

  try {
    const roleResult = await syncDomainRoleFromAuthIdentity({
      id: response.user.id,
      email: response.user.email,
      name: response.user.name,
    });

    destination = resolveDestinationByRole(roleResult.role);
  } catch (error) {
    console.error('role_sync_failed', {
      phase: 'role_sync',
      action: 'register',
      email: response.user.email,
      betterAuthId: response.user.id,
      error: error instanceof Error ? error.message : String(error),
    });
    destination = resolveDestinationByRole('customer');
  }

  redirect(destination);
}

export async function forgotPasswordAction(formData: FormData) {
  const email = normalizeEmail(formData.get('email'));
  if (!email) {
    redirect('/auth/forgot-password?error=missing');
  }

  const resetEnabled = process.env.BETTER_AUTH_PASSWORD_RESET_ENABLED === 'true';
  if (!resetEnabled) {
    redirect('/auth/forgot-password?status=disabled');
  }

  let destination = '/auth/forgot-password?error=server';

  try {
    const authApi = auth.api as unknown as {
      requestPasswordReset?: (input: {
        body: { email: string; redirectTo: string };
        headers: Headers;
      }) => Promise<unknown>;
    };

    await authApi.requestPasswordReset?.({
      body: {
        email,
        redirectTo: `${process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'}/auth/reset-password`,
      },
      headers: await getHeaderStore(),
    });

    destination = '/auth/forgot-password?status=sent';
  } catch {
    destination = '/auth/forgot-password?error=server';
  }

  redirect(destination);
}

export async function logoutAction() {
  await clearSession();
  redirect('/auth/login');
}
