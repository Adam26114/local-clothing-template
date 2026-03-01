import Link from 'next/link';

import { loginAction } from '@/app/(store)/auth/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; next?: string; email?: string }>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const error = resolvedSearchParams.error;
  const email =
    typeof resolvedSearchParams.email === 'string' ? resolvedSearchParams.email : undefined;

  return (
    <div className="mx-auto max-w-md rounded border p-6">
      <h1 className="mb-1 text-2xl font-semibold">Sign In</h1>
      <p className="mb-6 text-sm text-zinc-600">Use email/password. Superadmin is env-based.</p>
      {error ? (
        <p className="mb-4 rounded bg-red-100 px-3 py-2 text-sm text-red-700">
          {error === 'missing'
            ? 'Please fill in all required fields.'
            : error === 'exists'
              ? 'Account already exists. Please sign in with your password.'
            : error === 'server'
              ? 'Login failed due to server/env configuration. Please try again.'
              : 'Invalid email or password.'}
        </p>
      ) : null}
      <form className="space-y-4" action={loginAction}>
        <input
          type="hidden"
          name="next"
          value={typeof resolvedSearchParams.next === 'string' ? resolvedSearchParams.next : ''}
        />
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={email} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required />
        </div>
        <Button type="submit" className="w-full bg-black text-white hover:bg-zinc-800">
          Sign In
        </Button>
      </form>
      <div className="mt-4 flex justify-between text-sm">
        <Link href="/auth/forgot-password" className="text-zinc-600 hover:text-black">
          Forgot password?
        </Link>
        <Link href="/auth/register" className="text-zinc-600 hover:text-black">
          Create account
        </Link>
      </div>
    </div>
  );
}
