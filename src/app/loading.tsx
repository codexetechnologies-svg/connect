export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-background" aria-busy="true" aria-label="Loading page">
      <div className="flex items-center gap-3 rounded-xl border border-brand-border bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-soft">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-navy" />
        Loading…
      </div>
    </main>
  );
}
