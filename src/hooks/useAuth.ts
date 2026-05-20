import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { AuthChangeEvent, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import type { Profile } from '../types';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data as Profile;
}

function clearClientStorage() {
  try {
    localStorage.clear();
  } catch {
    // Ignore storage access failures in restricted browser contexts.
  }

  try {
    sessionStorage.clear();
  } catch {
    // Ignore storage access failures in restricted browser contexts.
  }
}

export function useAuthState(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const hadAuthenticatedSession = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const syncAuthState = (sessionUser: User | null, event?: AuthChangeEvent) => {
      setUser(sessionUser);

      if (!sessionUser) {
        const shouldForceLogoutFlow = event === 'SIGNED_OUT' && hadAuthenticatedSession.current;

        if (shouldForceLogoutFlow) {
          clearClientStorage();
          if (window.location.pathname !== '/login') {
            window.location.assign('/login');
          }
        }

        setProfile(null);
        setLoading(false);
        return;
      }

      hadAuthenticatedSession.current = true;
      setLoading(false);
      void fetchProfile(sessionUser.id).then((p) => {
        if (!isMounted) return;
        setProfile(p);
      });
    };

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!isMounted) return;
        syncAuthState(session?.user ?? null, 'INITIAL_SESSION');
      })
      .catch(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      syncAuthState(session?.user ?? null, event);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }

  async function signInWithGoogle(): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) return { error: error.message };
    return { error: null };
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut();
    clearClientStorage();
  }

  return { user, profile, loading, signIn, signInWithGoogle, signOut };
}
