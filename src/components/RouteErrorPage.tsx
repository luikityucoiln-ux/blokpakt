import { useEffect } from 'react';
import { useRouteError } from 'react-router';
import { RefreshCw } from 'lucide-react';

export default function RouteErrorPage() {
  const error = useRouteError();
  useEffect(() => { console.error('Page loading failed', error); }, [error]);
  return <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
    <section className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
      <img src="/assets/blokpakt-bp-mark.svg" alt="Blokpakt" className="mx-auto h-12 w-12" />
      <h1 className="mt-6 text-2xl font-extrabold">This page couldn't load</h1>
      <p className="mt-3 text-sm text-muted-foreground">A page file may be unavailable, or your connection may have been interrupted. Reload to request the latest version. This is not a database setup error.</p>
      <button type="button" onClick={() => window.location.reload()} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"><RefreshCw size={16} />Reload page</button>
      <a href="/" className="mt-3 block rounded-xl border border-border px-4 py-3 text-sm font-semibold">Back to home</a>
      <p className="mt-4 text-xs text-muted-foreground">If this continues, share the page address with support. Do not delete your Supabase tables.</p>
    </section>
  </main>;
}
