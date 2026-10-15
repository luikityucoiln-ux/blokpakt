import { useState } from 'react';
import { Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { ArrowRight, CheckCircle, KeyRound, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '../hooks/use-auth';

export default function LoginPage() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  return <>
    <Helmet><title>Log in — Blokpakt</title><meta name="robots" content="noindex, nofollow" /></Helmet>
    <main className="flex min-h-[75vh] items-center bg-muted/30 px-4 py-12 sm:py-20">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-card shadow-xl lg:grid-cols-2">
        <section className="relative order-2 overflow-hidden bg-primary p-8 text-primary-foreground sm:p-12 lg:order-1">
          <div aria-hidden="true" className="absolute -right-16 -top-16 h-64 w-64 rounded-full border-[35px] border-white/5" />
          <p className="relative text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground/70">Your neighborhood, together</p>
          <h1 className="relative mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl">Welcome to<br />your block.</h1>
          <p className="relative mt-5 max-w-sm text-sm leading-relaxed text-primary-foreground/80">One simple sign-in for your Blokpakt account. No password to remember, and no account required to explore the booking demo.</p>
          <div className="relative mt-10 space-y-5">
            <div className="flex gap-3"><KeyRound size={20} className="shrink-0" /><div><p className="text-sm font-bold">A link, not another password</p><p className="mt-1 text-xs text-primary-foreground/70">Sign in through your email inbox.</p></div></div>
            <div className="flex gap-3"><ShieldCheck size={20} className="shrink-0" /><div><p className="text-sm font-bold">You choose when to sign in</p><p className="mt-1 text-xs text-primary-foreground/70">You can still browse and try a guest booking.</p></div></div>
          </div>
          <p className="relative mt-10 rounded-xl border border-white/15 bg-white/5 p-3 text-xs leading-relaxed text-primary-foreground/80">The US service-request pilot uses your verified account. Requests need manual review before confirmation. Separate demo bookings remain in this browser; signing in does not grant admin or provider approval.</p>
        </section>
        <section className="order-1 p-8 sm:p-12 lg:order-2">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><UserRound size={24} /></div>
          {auth.user ? <>
            <h2 className="text-2xl font-extrabold">You're signed in</h2>
            <p className="mt-2 break-all text-sm text-muted-foreground">{auth.user.email}</p>
            <p className="mt-4 text-sm text-muted-foreground">Your account is connected. Existing demo bookings remain in this tab, not in your online account.</p>
            <Link to="/request-service" className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-white">Request a home service <ArrowRight size={16} /></Link>
            <Link to="/requests" className="mt-3 block rounded-xl border border-border px-4 py-3 text-center text-sm font-semibold">My service requests</Link>
            <Link to="/ops" className="mt-3 block text-center text-sm font-semibold text-primary">Operator dashboard (approved admins only)</Link>
            <Link to="/field" className="mt-3 block rounded-xl border border-border px-4 py-3 text-center text-sm font-semibold">Open provider demo</Link>
            <button type="button" disabled={busy} onClick={async () => {
              setBusy(true); setError('');
              try { await auth.signOut(); setSentTo(''); }
              catch (error) { setError(error instanceof Error ? error.message : 'Could not sign out. Please try again.'); }
              finally { setBusy(false); }
            }} className="mt-4 w-full py-2 text-sm font-semibold text-muted-foreground disabled:opacity-50">{busy ? 'Signing out...' : 'Sign out of this browser'}</button>
          </> : sentTo ? <>
            <CheckCircle className="mb-4 text-primary" size={24} />
            <h2 className="text-2xl font-extrabold">Check your inbox</h2>
            <p className="mt-3 text-sm text-muted-foreground">We requested a sign-in link for <strong className="break-all text-foreground">{sentTo}</strong>. Check spam too, and open it in this same browser to finish signing in.</p>
            <p className="mt-3 text-xs text-muted-foreground">You are not signed in yet. Email delivery depends on the project's mail settings.</p>
            <button type="button" onClick={() => setSentTo('')} className="mt-6 w-full rounded-xl border border-border px-4 py-3 text-sm font-bold">Try again or use another email</button>
          </> : <>
            <h2 className="text-2xl font-extrabold">Log in or get started</h2>
            <p className="mt-2 text-sm text-muted-foreground">We'll email you a sign-in link. On your first visit, an account is created through email verification.</p>
            <form className="mt-7 space-y-4" onSubmit={async (event) => {
              event.preventDefault();
              if (busy) return;
              setBusy(true); setError('');
              try { await auth.sendSignInLink(email); setSentTo(email.trim()); }
              catch (error) { setError(error instanceof Error ? error.message : 'Could not send the sign-in link. Please try again.'); }
              finally { setBusy(false); }
            }}>
              <label className="block text-sm font-semibold" htmlFor="login-email">Email address</label>
              <div className="relative"><Mail className="absolute left-4 top-3.5 text-muted-foreground" size={18} /><input id="login-email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-12 w-full rounded-xl border border-border bg-background py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
              <button type="submit" disabled={busy || auth.status === 'loading' || auth.status === 'unavailable'} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50">
                {busy ? 'Sending link...' : auth.status === 'loading' ? 'Preparing sign-in...' : 'Email me a sign-in link'}<ArrowRight size={16} />
              </button>
            </form>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">Providers can use their business email. Provider review and permissions are separate from sign-in.</p>
          </>}
          {(error || auth.error) && <p role="alert" className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{error || auth.error}</p>}
          {auth.status === 'unavailable' && <button type="button" onClick={() => window.location.reload()} className="mt-3 w-full rounded-xl border border-border px-4 py-3 text-sm font-semibold">Reload sign-in</button>}
          <div className="mt-8 border-t border-border pt-5 text-center"><Link to="/book" className="text-sm font-semibold text-primary hover:underline">Continue without signing in</Link><p className="mt-3 text-xs text-muted-foreground"><Link to="/legal" className="underline">Privacy and terms</Link></p></div>
        </section>
      </div>
    </main>
  </>;
}
