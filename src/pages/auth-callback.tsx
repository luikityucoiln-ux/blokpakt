import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { useAuth } from '../hooks/use-auth';

export default function AuthCallbackPage() {
  const { finishSignIn } = useAuth();
  const navigate = useNavigate();
  const completion = useRef<Promise<void> | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    if (!completion.current) {
      const url = new window.URL(window.location.href);
      const code = url.searchParams.get('code');
      const failed = url.searchParams.has('error') || new window.URLSearchParams(url.hash.slice(1)).has('error');
      window.history.replaceState(window.history.state, '', '/auth/callback');
      completion.current = failed || !code
        ? Promise.reject(new Error('This sign-in link is missing, expired, or invalid. Request a new link and open it in the same browser.'))
        : finishSignIn(code);
    }
    void completion.current.then(() => {
      if (active) navigate('/login', { replace: true });
    }).catch((error: unknown) => {
      if (active) setError(error instanceof Error ? error.message : 'Could not complete sign-in. Please request a new link.');
    });
    return () => { active = false; };
  }, [finishSignIn, navigate]);
  return <>
    <Helmet><title>Complete sign-in — Blokpakt</title><meta name="robots" content="noindex, nofollow" /><meta name="referrer" content="no-referrer" /></Helmet>
    <main className="flex min-h-[70vh] items-center justify-center bg-muted/30 px-4 py-12">
      <section className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="text-2xl font-extrabold">{error ? 'Unable to sign in' : 'Finishing your sign-in'}</h1>
        {error ? <><p role="alert" className="mt-4 text-sm text-destructive">{error}</p><Link to="/login" className="mt-6 block rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground">Request a new sign-in link</Link></> : <p role="status" className="mt-4 text-sm text-muted-foreground">Verifying your email link...</p>}
      </section>
    </main>
  </>;
}
