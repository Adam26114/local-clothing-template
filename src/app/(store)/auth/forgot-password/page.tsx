import { forgotPasswordAction } from '@/app/(store)/auth/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; error?: string }>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};

  return (
    <div className="mx-auto max-w-md rounded border p-6">
      <h1 className="mb-1 text-2xl font-semibold">Forgot Password</h1>
      <p className="mb-6 text-sm text-zinc-600">
        Enter your email to request a password reset link.
      </p>
      {resolvedSearchParams.status === 'disabled' ? (
        <p className="mb-4 rounded bg-zinc-100 px-3 py-2 text-sm text-zinc-700">
          Password reset is disabled in this environment.
        </p>
      ) : null}
      {resolvedSearchParams.status === 'sent' ? (
        <p className="mb-4 rounded bg-green-100 px-3 py-2 text-sm text-green-700">
          If your email exists, a reset link has been sent.
        </p>
      ) : null}
      {resolvedSearchParams.error ? (
        <p className="mb-4 rounded bg-red-100 px-3 py-2 text-sm text-red-700">
          {resolvedSearchParams.error === 'missing'
            ? 'Please provide an email address.'
            : 'Could not process the password reset request.'}
        </p>
      ) : null}
      <form className="space-y-4" action={forgotPasswordAction}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <Button type="submit" className="w-full bg-black text-white hover:bg-zinc-800">
          Send Reset Link
        </Button>
      </form>
    </div>
  );
}
