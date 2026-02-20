import {
  createContext, useContext, useEffect, useState, useCallback, type ReactNode,
} from 'react';
import type { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AuthContextValue {
  session:      Session | null;
  user:         User    | null;
  loading:      boolean;
  seeds:        number;
  refetchSeeds: () => Promise<void>;
  signUp:       (email: string, password: string) => Promise<AuthError | null>;
  signIn:       (email: string, password: string) => Promise<AuthError | null>;
  signOut:      () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeds,   setSeeds]   = useState(0);

  const fetchSeeds = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('seeds')
      .eq('id', userId)
      .single();
    if (data) setSeeds(data.seeds ?? 0);
  }, []);

  const refetchSeeds = useCallback(async () => {
    const { data: { session: s } } = await supabase.auth.getSession();
    if (s?.user?.id) await fetchSeeds(s.user.id);
  }, [fetchSeeds]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user?.id) fetchSeeds(data.session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user?.id) fetchSeeds(s.user.id);
      else setSeeds(0);
    });

    return () => subscription.unsubscribe();
  }, [fetchSeeds]);

  async function signUp(email: string, password: string): Promise<AuthError | null> {
    const { error } = await supabase.auth.signUp({ email, password });
    return error;
  }

  async function signIn(email: string, password: string): Promise<AuthError | null> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error;
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut();
    setSeeds(0);
  }

  return (
    <AuthContext.Provider value={{
      session,
      user:    session?.user ?? null,
      loading,
      seeds,
      refetchSeeds,
      signUp,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
