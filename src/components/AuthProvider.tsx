import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { AuthContext, type AuthState } from '../hooks/use-auth';
import { getSupabaseClient } from '../lib/supabase-client';

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthState['status']>('loading');
  const [error, setError] = useState('');
  const revision = useRef(0);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    const initialRevision = revision.current;
    void (async () => {
      try {
        const client = await getSupabaseClient();
        if (!active) return;
        const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
          if (!active) return;
          revision.current += 1;
          setUser(session?.user ?? null);
          setStatus(session ? 'signed-in' : 'signed-out');
          setError('');
        });
        unsubscribe = () => listener.subscription.unsubscribe();
        const { data, error } = await client.auth.getSession();
        // Do not overwrite a newer callback, sign-out, or session event.
        if (!active || revision.current !== initialRevision) return;
        if (error) throw error;
        setUser(data.session?.user ?? null);
        setStatus(data.session ? 'signed-in' : 'signed-out');
      } catch (error) {
        if (!active || revision.current !== initialRevision) return;
        console.error('Sign-in could not be initialized', error);
        setError(error instanceof Error ? error.message : 'Sign-in is unavailable.');
        setStatus('unavailable');
      }
    })();
    return () => { active = false; unsubscribe?.(); };
  }, []);

  const sendSignInLink = useCallback(async (email: string) => {
    const client = await getSupabaseClient();
    const { error } = await client.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  }, []);

  const finishSignIn = useCallback(async (code: string) => {
    const client = await getSupabaseClient();
    const { data, error } = await client.auth.exchangeCodeForSession(code);
    if (error) throw error;
    if (!data.user || !data.session) throw new Error('No session was returned. Please request a new sign-in link.');
    revision.current += 1;
    setUser(data.user);
    setStatus('signed-in');
    setError('');
  }, []);

  const signOut = useCallback(async () => {
    const client = await getSupabaseClient();
    const { error } = await client.auth.signOut({ scope: 'local' });
    if (error) throw error;
    revision.current += 1;
    setUser(null);
    setStatus('signed-out');
    setError('');
  }, []);

  const value = useMemo(() => ({ user, status, error, sendSignInLink, finishSignIn, signOut }), [user, status, error, sendSignInLink, finishSignIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
