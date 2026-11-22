export default function ProtectedLoading() {
  return (
    <main className="page-shell" aria-busy="true" aria-label="Loading page">
      <div className="page-container animate-pulse">
        <div className="mb-6 h-4 w-32 rounded bg-slate-200" />
        <div className="mb-8 h-9 w-64 max-w-full rounded bg-slate-200" />
        <div className="card h-64 rounded-2xl bg-slate-100" />
      </div>
    </main>
  );
}
