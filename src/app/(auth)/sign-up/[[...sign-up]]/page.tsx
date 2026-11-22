import Link from 'next/link';

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-background px-4 py-10 text-center">
      <div className="max-w-lg rounded-2xl border border-brand-border bg-white p-8 shadow-soft">
        <h1 className="text-2xl font-bold text-brand-navy">Registration is not open yet</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          New accounts require business onboarding and verification. Contact support to request access.
        </p>
        <Link href="/login" className="mt-6 inline-flex font-semibold text-brand-navy underline">
          Return to sign in
        </Link>
      </div>
    </main>
  );
}
