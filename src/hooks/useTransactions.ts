import { useCallback, useRef, useState } from 'react';
import { getDaysInMonth } from 'date-fns';
import { supabase } from '../lib/supabaseClient';
import type { Transaction, TransactionFormData, TransactionType } from '../types';
import { getThaiErrorMessage } from '../utils/errors';

interface UseTransactionsReturn {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  fetchTransactions: (year: number, month: number, type?: TransactionType | 'all') => Promise<Transaction[]>;
  fetchYearTransactions: (year: number) => Promise<Transaction[]>;
  addTransaction: (data: TransactionFormData) => Promise<Transaction>;
  updateTransaction: (id: string, data: TransactionFormData) => Promise<Transaction>;
  softDeleteTransaction: (id: string) => Promise<void>;
  restoreTransaction: (id: string) => Promise<void>;
}

interface TransactionRow extends Omit<Transaction, 'category'> {
  category: string;
  category_details: { name: string } | { name: string }[] | null;
}

const TRANSACTION_SELECT = '*, category_details:categories!transactions_category_id_fkey(name)';

function normalizeTransaction(row: TransactionRow): Transaction {
  const { category_details, ...transaction } = row;
  const relation = Array.isArray(category_details) ? category_details[0] : category_details;
  return {
    ...transaction,
    amount: Number(row.amount),
    category: relation?.name ?? row.category,
    category_id: row.category_id ?? null,
    deleted_at: row.deleted_at ?? null,
  };
}

async function getAuthenticatedUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Not authenticated');
  return user;
}

export function useTransactions(): UseTransactionsReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const runFetch = useCallback(async (startDate: string, endDate: string, type?: TransactionType | 'all') => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const user = await getAuthenticatedUser();
      let query = supabase
        .from('transactions')
        .select(TRANSACTION_SELECT)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (type && type !== 'all') query = query.eq('type', type);

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      const next = ((data ?? []) as TransactionRow[]).map(normalizeTransaction);
      if (requestId === requestIdRef.current) setTransactions(next);
      return next;
    } catch (fetchError) {
      const message = getThaiErrorMessage(fetchError, 'โหลดรายการไม่สำเร็จ กรุณาลองใหม่');
      if (requestId === requestIdRef.current) setError(message);
      return [];
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(
    (year: number, month: number, type?: TransactionType | 'all') => {
      const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = `${year}-${String(month).padStart(2, '0')}-${getDaysInMonth(new Date(year, month - 1))}`;
      return runFetch(firstDay, lastDay, type);
    },
    [runFetch]
  );

  const fetchYearTransactions = useCallback(
    (year: number) => runFetch(`${year}-01-01`, `${year}-12-31`, 'all'),
    [runFetch]
  );

  const addTransaction = useCallback(async (formData: TransactionFormData): Promise<Transaction> => {
    const user = await getAuthenticatedUser();
    const { data, error: insertError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: formData.type,
        amount: Number(formData.amount),
        category_id: formData.category_id,
        category: formData.category,
        date: formData.date,
        note: formData.note.trim() || null,
      })
      .select(TRANSACTION_SELECT)
      .single();

    if (insertError || !data) throw new Error(getThaiErrorMessage(insertError, 'เพิ่มรายการไม่สำเร็จ'));
    return normalizeTransaction(data as TransactionRow);
  }, []);

  const updateTransaction = useCallback(async (id: string, formData: TransactionFormData): Promise<Transaction> => {
    const user = await getAuthenticatedUser();
    const { data, error: updateError } = await supabase
      .from('transactions')
      .update({
        type: formData.type,
        amount: Number(formData.amount),
        category_id: formData.category_id,
        category: formData.category,
        date: formData.date,
        note: formData.note.trim() || null,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .select(TRANSACTION_SELECT)
      .single();

    if (updateError || !data) throw new Error(getThaiErrorMessage(updateError, 'แก้ไขรายการไม่สำเร็จ'));
    return normalizeTransaction(data as TransactionRow);
  }, []);

  const setDeletedAt = useCallback(async (id: string, deletedAt: string | null) => {
    const user = await getAuthenticatedUser();
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ deleted_at: deletedAt })
      .eq('id', id)
      .eq('user_id', user.id);
    if (updateError) throw new Error(getThaiErrorMessage(updateError, 'เปลี่ยนสถานะรายการไม่สำเร็จ'));
  }, []);

  const softDeleteTransaction = useCallback((id: string) => setDeletedAt(id, new Date().toISOString()), [setDeletedAt]);
  const restoreTransaction = useCallback((id: string) => setDeletedAt(id, null), [setDeletedAt]);

  return {
    transactions,
    loading,
    error,
    fetchTransactions,
    fetchYearTransactions,
    addTransaction,
    updateTransaction,
    softDeleteTransaction,
    restoreTransaction,
  };
}
