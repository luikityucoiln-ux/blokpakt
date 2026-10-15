import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { useAuth } from '../hooks/use-auth';

export default function PilotShell({ title, children }: { title: string; children: ReactNode }) {
  return <>
    <Helmet><title>{title} | Blokpakt</title><meta name="robots" content="noindex, nofollow" /><meta name="referrer" content="no-referrer" /></Helmet>
    <main className="min-h-[70vh] bg-muted/20 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">US home-service pilot</p>
        <h1 className="mt-3 text-3xl font-extrabold">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground">Real service requests, reviewed by a person. Coverage, provider availability, quote, and timing must be agreed before work is confirmed. No online payment is taken.</p>
        <nav aria-label="Service requests" className="my-6 flex flex-wrap gap-4 text-sm font-semibold text-primary">
          <Link to="/request-service">Request service</Link><Link to="/requests">My requests</Link><Link to="/ops">Operator sign-in</Link>
        </nav>
        {children}
      </div>
    </main>
  </>;
}

export function PilotAccess({ children }: { children: ReactNode }) {
  const auth = useAuth();
  if (auth.status === 'loading') return <p role="status">Checking your sign-in...</p>;
  if (!auth.user) return <div className="rounded-2xl border border-border bg-card p-6">
    <h2 className="text-xl font-bold">Sign in to continue</h2>
    <p className="my-3 text-sm text-muted-foreground">Verify your email so your real service requests stay private. After signing in, choose Request service or My requests on your account page.</p>
    {auth.error && <p role="alert" className="mb-3 text-sm text-destructive">{auth.error}</p>}
    <Link to="/login" className="inline-block rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground">Log in with email</Link>
  </div>;
  return <div key={auth.user.id}>{children}</div>;
}
