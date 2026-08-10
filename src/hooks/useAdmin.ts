import { useState, useCallback } from 'react';
import { supabase, supabaseAnonKey, supabaseUrl } from '../lib/supabaseClient';
import type { AdminUser, UserRole } from '../types';
import { getThaiErrorMessage } from '../utils/errors';

interface UseAdminReturn {
  users: AdminUser[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  updateUserRole: (id: string, role: UserRole) => Promise<void>;
  toggleUserActive: (id: string, isActive: boolean) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  inviteUser: (data: { full_name: string; email: string; role: UserRole }) => Promise<void>;
}

async function getResponseErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.clone().json();
    if (typeof body?.error === 'string') return body.error;
    if (typeof body?.message === 'string') return body.message;
  } catch {
    try {
      const body = await response.clone().text();
      if (body) return body;
    } catch {
      // Fall through to the generic HTTP error below.
    }
  }

  return `Edge Function returned ${response.status}`;
}

async function invokeAdminFunction(functionName: string, body: Record<string, unknown>): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');

  const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      'x-user-authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await getResponseErrorMessage(response));
  }
}

export function useAdmin(): UseAdminReturn {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, is_active, created_at')
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(getThaiErrorMessage(fetchError, 'โหลดรายชื่อสมาชิกไม่สำเร็จ'));
      } else {
        setUsers((data as AdminUser[]) ?? []);
      }
    } catch (err) {
      setError(getThaiErrorMessage(err, 'โหลดรายชื่อสมาชิกไม่สำเร็จ'));
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserRole = useCallback(async (id: string, role: UserRole): Promise<void> => {
    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', id)
      .select();
    if (updateError || !data || data.length === 0) throw new Error(getThaiErrorMessage(updateError, 'เปลี่ยนสิทธิ์ไม่สำเร็จ'));
  }, []);

  const toggleUserActive = useCallback(
    async (id: string, isActive: boolean): Promise<void> => {
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', id)
        .select();
      if (updateError || !data || data.length === 0) throw new Error(getThaiErrorMessage(updateError, 'เปลี่ยนสถานะสมาชิกไม่สำเร็จ'));
    },
    []
  );

  const deleteUser = useCallback(async (id: string): Promise<void> => {
    await invokeAdminFunction('delete-user', { user_id: id });
  }, []);

  const inviteUser = useCallback(
    async (payload: { full_name: string; email: string; role: UserRole }): Promise<void> => {
      await invokeAdminFunction('invite-user', {
        ...payload,
        full_name: payload.full_name.trim(),
        email: payload.email.trim().toLowerCase(),
        redirect_to: `${window.location.origin}/set-password`,
      });
    },
    []
  );

  return { users, loading, error, fetchUsers, updateUserRole, toggleUserActive, deleteUser, inviteUser };
}
