import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import type { Profile } from '../types';
import { getThaiErrorMessage } from '../utils/errors';

interface AuthResult {
  error: string | null;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  notice: string | null;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  clearNotice: () => void;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  return data as Profile;
}

function clearClientStorage() {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}

export function useAuthState(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const syncIdRef = useRef(0);

  useEffect(() => {
    let isMounted = true;

    async function syncSession(sessionUser: User | null) {
      const syncId = ++syncIdRef.current;
      if (!sessionUser) {
        if (!isMounted || syncId !== syncIdRef.current) return;
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      const nextProfile = await fetchProfile(sessionUser.id);
      if (!isMounted || syncId !== syncIdRef.current) return;

      if (!nextProfile) {
        setNotice('ไม่พบข้อมูลสมาชิก กรุณาติดต่อผู้ดูแลระบบ');
        await supabase.auth.signOut({ scope: 'local' });
        clearClientStorage();
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      if (!nextProfile.is_active) {
        setNotice('บัญชีนี้ถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ');
        await supabase.auth.signOut({ scope: 'local' });
        clearClientStorage();
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(sessionUser);
      setProfile(nextProfile);
      setLoading(false);
    }

    void supabase.auth.getSession().then(({ data: { session } }) => syncSession(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncSession(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string): Promise<AuthResult> {
    setNotice(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    return { error: error ? getThaiErrorMessage(error) : null };
  }

  async function signInWithGoogle(): Promise<AuthResult> {
    setNotice(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    return { error: error ? getThaiErrorMessage(error, 'เชื่อมต่อ Google ไม่สำเร็จ') : null };
  }

  async function resetPassword(email: string): Promise<AuthResult> {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/set-password`,
    });
    return { error: error ? getThaiErrorMessage(error, 'ส่งลิงก์ตั้งรหัสผ่านใหม่ไม่สำเร็จ') : null };
  }

  async function signOut(): Promise<void> {
    setNotice(null);
    await supabase.auth.signOut();
    clearClientStorage();
    setUser(null);
    setProfile(null);
  }

  return {
    user,
    profile,
    loading,
    notice,
    signIn,
    signInWithGoogle,
    resetPassword,
    signOut,
    clearNotice: () => setNotice(null),
  };
}
