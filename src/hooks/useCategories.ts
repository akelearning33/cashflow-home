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
    const { data, error: fetchError } = await supabase
      .from('categories')
      .select('id, type, name')
      .order('name');
    setLoading(false);
    if (fetchError) {
      setError(fetchError.message);
      return;
    }
    setCategories((data ?? []) as Category[]);
  }, []);

  const addCategory = useCallback(async (type: TransactionType, name: string) => {
    const { data, error: insertError } = await supabase
      .from('categories')
      .insert({ type, name })
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

  return { categories, loading, error, fetchCategories, addCategory, updateCategory, deleteCategory };
}
