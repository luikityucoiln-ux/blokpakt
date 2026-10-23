import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { ClipboardList } from 'lucide-react';
import { useAuth } from '../hooks/use-auth';

export default function PilotShell({ title, children, operator = false }: { title: string; children: ReactNode; operator?: boolean }) {
  return <>
    <Helmet><title>{title} | Blokpakt</title><meta name="robots" content="noindex, nofollow" /><meta name="referrer" content="no-referrer" /></Helmet>
    <main className={`min-h-[70vh] px-4 py-10 ${operator ? 'bg-background' : 'bg-muted/20'}`}>
      <div className="mx-auto max-w-5xl">
        <header className={operator ? 'relative overflow-hidden rounded-[2rem] bg-primary p-6 text-primary-foreground sm:p-10' : undefined}>
          {operator && <div className="mb-6 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-orange-200"><ClipboardList size={22} aria-hidden="true" /></span><span className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold">Operator workspace</span></div>}
          <p className={`text-xs font-bold uppercase tracking-widest ${operator ? 'text-orange-200' : 'text-primary'}`}>US home-service pilot</p>
          <h1 className="mt-3 text-3xl font-extrabold">{title}</h1>
          <p className={`mt-3 max-w-3xl text-sm leading-relaxed ${operator ? 'text-white/80' : 'text-muted-foreground'}`}>Real service requests, reviewed by a person. Coverage, provider availability, quote, and timing must be agreed before work is confirmed. No online payment is taken.</p>
        </header>
        <nav aria-label="Service requests" className={`my-6 flex flex-wrap gap-3 text-sm font-semibold text-primary ${operator ? '[&>a]:inline-flex [&>a]:min-h-11 [&>a]:items-center [&>a]:rounded-xl [&>a]:border [&>a]:border-border [&>a]:bg-card [&>a]:px-4 [&>a]:py-2 [&>a:hover]:bg-primary/5 [&>a:focus-visible]:ring-2 [&>a:focus-visible]:ring-primary/40' : ''}`}>
          <Link to="/request-service">Request service</Link><Link to="/requests">My requests</Link><Link to="/ops" aria-current={operator ? 'page' : undefined}>Operator sign-in</Link>
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
