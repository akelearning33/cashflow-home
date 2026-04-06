import { useState, useCallback } from 'react';
import { getDaysInMonth } from 'date-fns';
import { supabase } from '../lib/supabaseClient';
import type { Transaction, TransactionFormData, TransactionType } from '../types';

interface UseTransactionsReturn {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  fetchTransactions: (year: number, month: number, type?: TransactionType | 'all') => Promise<void>;
  addTransaction: (data: TransactionFormData) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}

export function useTransactions(): UseTransactionsReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(
    async (year: number, month: number, type?: TransactionType | 'all') => {
      setLoading(true);
      setError(null);

      const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = `${year}-${String(month).padStart(2, '0')}-${getDaysInMonth(
        new Date(year, month - 1)
      )}`;

      let query = supabase
        .from('transactions')
        .select('*')
        .gte('date', firstDay)
        .lte('date', lastDay)
        .order('date', { ascending: false });

      if (type && type !== 'all') {
        query = query.eq('type', type);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setTransactions((data as Transaction[]) ?? []);
      }
      setLoading(false);
    },
    []
  );

  const addTransaction = useCallback(async (formData: TransactionFormData): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error: insertError } = await supabase.from('transactions').insert({
      user_id: user.id,
      type: formData.type,
      amount: parseFloat(formData.amount),
      category: formData.category,
      date: formData.date,
      note: formData.note.trim() || null,
    });

    if (insertError) throw new Error(insertError.message);
  }, []);

  const deleteTransaction = useCallback(async (id: string): Promise<void> => {
    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (deleteError) throw new Error(deleteError.message);
  }, []);

  return { transactions, loading, error, fetchTransactions, addTransaction, deleteTransaction };
}
