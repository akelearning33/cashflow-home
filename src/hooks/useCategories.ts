import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Category, TransactionType } from '../types';
import { getThaiErrorMessage } from '../utils/errors';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('id, type, name, user_id, is_active')
        .or(`user_id.is.null,user_id.eq.${user.id}`)
        .order('is_active', { ascending: false })
        .order('name');
      if (fetchError) throw fetchError;
      setCategories((data ?? []) as Category[]);
    } catch (fetchError) {
      setError(getThaiErrorMessage(fetchError, 'โหลดหมวดหมู่ไม่สำเร็จ'));
    } finally {
      setLoading(false);
    }
  }, []);

  const addCategory = useCallback(async (type: TransactionType, name: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { error: insertError } = await supabase
      .from('categories')
      .insert({ type, name: name.trim(), user_id: user.id, is_active: true });
    if (insertError) throw new Error(getThaiErrorMessage(insertError, 'เพิ่มหมวดหมู่ไม่สำเร็จ'));
  }, []);

  const addSystemCategory = useCallback(async (type: TransactionType, name: string) => {
    const { error: insertError } = await supabase
      .from('categories')
      .insert({ type, name: name.trim(), user_id: null, is_active: true });
    if (insertError) throw new Error(getThaiErrorMessage(insertError, 'เพิ่มหมวดหมู่ระบบไม่สำเร็จ'));
  }, []);

  const updateCategory = useCallback(async (id: string, name: string) => {
    const { error: updateError } = await supabase
      .from('categories')
      .update({ name: name.trim() })
      .eq('id', id);
    if (updateError) throw new Error(getThaiErrorMessage(updateError, 'แก้ไขหมวดหมู่ไม่สำเร็จ'));
  }, []);

  const setCategoryActive = useCallback(async (id: string, isActive: boolean) => {
    const { error: updateError } = await supabase
      .from('categories')
      .update({ is_active: isActive })
      .eq('id', id);
    if (updateError) throw new Error(getThaiErrorMessage(updateError, isActive ? 'กู้คืนหมวดหมู่ไม่สำเร็จ' : 'เก็บหมวดหมู่ไม่สำเร็จ'));
  }, []);

  const archiveCategory = useCallback((id: string) => setCategoryActive(id, false), [setCategoryActive]);
  const restoreCategory = useCallback((id: string) => setCategoryActive(id, true), [setCategoryActive]);

  const getCategoriesByType = useCallback(
    (type: TransactionType, includeArchived = false) => {
      const filtered = categories.filter((category) => category.type === type && (includeArchived || category.is_active));
      return {
        system: filtered.filter((category) => category.user_id === null),
        custom: filtered.filter((category) => category.user_id !== null),
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
    archiveCategory,
    restoreCategory,
    getCategoriesByType,
  };
}
