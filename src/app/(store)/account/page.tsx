import Link from 'next/link';

import { getSession } from '@/lib/auth/session';

export default async function AccountPage() {
  const session = await getSession();

  if (!session.isAuthenticated) {
    return (
      <div className="rounded border p-6">
        <h1 className="text-2xl font-semibold">My Account</h1>
        <p className="mt-2 text-sm text-zinc-600">Please sign in to view your account.</p>
        <Link
          href="/auth/login"
          className="mt-4 inline-flex rounded bg-black px-4 py-2 text-sm text-white"
        >
          Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded border p-6">
      <h1 className="text-2xl font-semibold">My Account</h1>
      <p className="text-sm text-zinc-600">Welcome back, {session.name ?? 'Customer'}.</p>
      <p className="text-sm text-zinc-600">Email: {session.email}</p>
      <div>
        <Link href="/account/orders" className="rounded border px-3 py-2 text-sm">
          View Order History
        </Link>
      </div>
    </div>
  );
}
