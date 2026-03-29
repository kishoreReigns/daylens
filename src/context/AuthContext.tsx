// ─────────────────────────────────────────────
//  AuthContext · Real Supabase authentication
//  Provides: user, session, loading, signIn,
//            signUp, signOut
// ─────────────────────────────────────────────
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase }           from '../lib/supabase';
import * as AuthAPI           from '../lib/api/auth';

// ── Context shape ─────────────────────────────
export interface AuthContextValue {
  user:               User    | null;
  session:            Session | null;
  loading:            boolean;
  signIn:             (email: string, password: string)                   => Promise<string | null>;
  signUp:             (email: string, password: string, fullName: string) => Promise<string | null>;
  signOut:            ()                                                   => Promise<void>;
  signInWithGoogle:   (idToken: string)                                   => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue>({
  user:             null,
  session:          null,
  loading:          true,
  signIn:           async () => null,
  signUp:           async () => null,
  signOut:          async () => {},
  signInWithGoogle: async () => null,
});

// ── Provider ──────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<User    | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydrate session from storage on first mount + subscribe to changes
  useEffect(() => {
    // Restore persisted session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    // Live auth state changes (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        setLoading(false);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── Actions ───────────────────────────────────
  const signIn = useCallback(
    async (email: string, password: string): Promise<string | null> => {
      const { error } = await AuthAPI.signIn(email, password);
      return error;
    },
    [],
  );

  const signUp = useCallback(
    async (email: string, password: string, fullName: string): Promise<string | null> => {
      const { error } = await AuthAPI.signUp(email, password, fullName);
      return error;
    },
    [],
  );

  const signOut = useCallback(async () => {
    await AuthAPI.signOut();
  }, []);

  const signInWithGoogle = useCallback(
    async (idToken: string): Promise<string | null> => {
      const { error } = await AuthAPI.signInWithGoogleIdToken(idToken);
      return error;
    },
    [],
  );

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────
export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
