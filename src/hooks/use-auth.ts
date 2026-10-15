import { createContext, useContext } from 'react';
import type { User } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  status: 'loading' | 'signed-out' | 'signed-in' | 'unavailable';
  error: string;
  sendSignInLink: (email: string) => Promise<void>;
  finishSignIn: (code: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider is required for sign-in controls.');
  return context;
}
