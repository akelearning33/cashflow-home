import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { AdminUser, UserRole } from '../types';

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

export function useAdmin(): UseAdminReturn {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, is_active, created_at')
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setUsers((data as AdminUser[]) ?? []);
    }
    setLoading(false);
  }, []);

  const updateUserRole = useCallback(async (id: string, role: UserRole): Promise<void> => {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', id);
    if (updateError) throw new Error(updateError.message);
  }, []);

  const toggleUserActive = useCallback(
    async (id: string, isActive: boolean): Promise<void> => {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', id);
      if (updateError) throw new Error(updateError.message);
    },
    []
  );

  const deleteUser = useCallback(async (id: string): Promise<void> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const res = await supabase.functions.invoke('delete-user', {
      body: { user_id: id },
    });

    if (res.error) throw new Error(res.error.message);
  }, []);

  const inviteUser = useCallback(
    async (payload: { full_name: string; email: string; role: UserRole }): Promise<void> => {
      const res = await supabase.functions.invoke('invite-user', {
        body: payload,
      });
      if (res.error) throw new Error(res.error.message);
    },
    []
  );

  return { users, loading, error, fetchUsers, updateUserRole, toggleUserActive, deleteUser, inviteUser };
}
