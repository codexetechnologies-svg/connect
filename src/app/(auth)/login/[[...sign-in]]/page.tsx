import Link from 'next/link';
import { SignIn } from '@clerk/nextjs';

const statusMessages: Record<string, string> = {
  'approval-required': 'Your account is not approved yet. Contact support if you believe this is an error.',
  'email-verification-required': 'Verify your email address with your identity provider, then sign in again.',
  'account-unavailable': 'This account is unavailable. Contact support for assistance.',
  'database-unavailable': 'Account access is temporarily unavailable because the application database is not configured. Contact the administrator.'
};

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const message = status ? statusMessages[status] : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-background px-4 py-10">
      <div className="w-full max-w-md">
        {message && (
          <p role="alert" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {message}
          </p>
        )}
        {status === 'database-unavailable' ? (
          <Link href="/" className="text-sm font-semibold text-brand-navy underline">
            Return to home
          </Link>
        ) : (
          <SignIn
            routing="path"
            path="/login"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/dashboard"
            withSignUp={false}
          />
        )}
      </div>
    </main>
  );
}
