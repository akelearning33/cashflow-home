import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Category, TransactionType } from '../types';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // RLS ensures we only get system defaults + current user's categories
      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('id, type, name, user_id')
        .order('name');
      if (fetchError) {
        setError(fetchError.message);
        return;
      }
      setCategories((data ?? []) as Category[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  /** Add a user-owned category (user_id is set automatically) */
  const addCategory = useCallback(async (type: TransactionType, name: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error: insertError } = await supabase
      .from('categories')
      .insert({ type, name, user_id: user.id })
      .select();
    if (insertError) throw new Error(insertError.message);
    if (!data || data.length === 0) throw new Error('Failed to add category. Your session may have expired — please log in again.');
  }, []);

  /** Add a system default category (admin only, user_id = null) */
  const addSystemCategory = useCallback(async (type: TransactionType, name: string) => {
    const { data, error: insertError } = await supabase
      .from('categories')
      .insert({ type, name, user_id: null })
      .select();
    if (insertError) throw new Error(insertError.message);
    if (!data || data.length === 0) throw new Error('Failed to add category. Your session may have expired — please log in again.');
  }, []);

  const updateCategory = useCallback(async (id: string, name: string) => {
    const { data, error: updateError } = await supabase
      .from('categories')
      .update({ name })
      .eq('id', id)
      .select();
    if (updateError) throw new Error(updateError.message);
    if (!data || data.length === 0) throw new Error('Failed to update category. Your session may have expired — please log in again.');
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    if (deleteError) throw new Error(deleteError.message);
  }, []);

  /** Helper: get categories split by system vs custom for a given type */
  const getCategoriesByType = useCallback(
    (type: TransactionType) => {
      const filtered = categories.filter((c) => c.type === type);
      return {
        system: filtered.filter((c) => c.user_id === null),
        custom: filtered.filter((c) => c.user_id !== null),
      };
    },
    [categories]
  );

  return {
    categories,
    loading,
    error,
    fetchCategories,
    addCategory,
    addSystemCategory,
    updateCategory,
    deleteCategory,
    getCategoriesByType,
  };
}
