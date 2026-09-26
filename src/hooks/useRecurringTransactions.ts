import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { RecurringTransaction, RecurringTransactionFormData, RecurringTransactionStatus } from '../types';
import { getThaiErrorMessage } from '../utils/errors';
import { getNextRecurringDate, getRecurringRunDate, toMonthStart } from '../utils/recurring';

interface RecurringTransactionRow extends Omit<RecurringTransaction, 'category'> {
  category: string;
  category_details: { name: string } | { name: string }[] | null;
}

interface UseRecurringTransactionsReturn {
  recurringTransactions: RecurringTransaction[];
  loading: boolean;
  error: string | null;
  fetchRecurringTransactions: () => Promise<RecurringTransaction[]>;
  addRecurringTransaction: (data: RecurringTransactionFormData) => Promise<RecurringTransaction>;
  updateRecurringTransaction: (id: string, data: RecurringTransactionFormData) => Promise<RecurringTransaction>;
  setRecurringStatus: (id: string, status: RecurringTransactionStatus) => Promise<RecurringTransaction>;
  processDueRecurringTransactions: () => Promise<number>;
}

const RECURRING_SELECT = '*, category_details:categories!recurring_transactions_category_id_fkey(name)';

function getNextEligibleDate(startMonth: string, dayOfMonth: number) {
  const firstEligibleDate = getRecurringRunDate(startMonth, dayOfMonth);
  const nextCalendarDate = getNextRecurringDate(dayOfMonth);
  return firstEligibleDate > nextCalendarDate ? firstEligibleDate : nextCalendarDate;
}

function normalizeRecurring(row: RecurringTransactionRow): RecurringTransaction {
  const { category_details, ...recurring } = row;
  const relation = Array.isArray(category_details) ? category_details[0] : category_details;
  return {
    ...recurring,
    amount: Number(row.amount),
    category: relation?.name ?? row.category,
    category_id: row.category_id ?? null,
    note: row.note ?? null,
  };
}

async function getAuthenticatedUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Not authenticated');
  return user;
}

export function useRecurringTransactions(): UseRecurringTransactionsReturn {
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processDueRecurringTransactions = useCallback(async () => {
    const { data, error: processError } = await supabase.rpc('process_my_recurring_transactions');
    if (processError) throw new Error(getThaiErrorMessage(processError, 'สร้างรายการประจำไม่สำเร็จ'));
    return Number(data ?? 0);
  }, []);

  const fetchRecurringTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // The rule list remains usable if the optional Cron/RPC setup is still
      // being enabled; the next scheduled run will catch up due rows.
      await processDueRecurringTransactions().catch(() => 0);
      const user = await getAuthenticatedUser();
      const { data, error: fetchError } = await supabase
        .from('recurring_transactions')
        .select(RECURRING_SELECT)
        .eq('user_id', user.id)
        .order('status', { ascending: true })
        .order('next_run_date', { ascending: true });
      if (fetchError) throw fetchError;
      const normalized = (data ?? []).map((row) => normalizeRecurring(row as RecurringTransactionRow));
      setRecurringTransactions(normalized);
      return normalized;
    } catch (fetchError) {
      setError(getThaiErrorMessage(fetchError, 'โหลดรายการประจำไม่สำเร็จ'));
      return [];
    } finally {
      setLoading(false);
    }
  }, [processDueRecurringTransactions]);

  const addRecurringTransaction = useCallback(async (formData: RecurringTransactionFormData) => {
    const user = await getAuthenticatedUser();
    const dayOfMonth = Number(formData.day_of_month);
    const startMonth = toMonthStart(formData.start_month);
    const { data, error: insertError } = await supabase
      .from('recurring_transactions')
      .insert({
        user_id: user.id,
        name: formData.name.trim(),
        type: formData.type,
        amount: Number(formData.amount),
        category_id: formData.category_id,
        category: formData.category,
        day_of_month: dayOfMonth,
        start_month: startMonth,
        next_run_date: getRecurringRunDate(startMonth, dayOfMonth),
        note: formData.note.trim() || null,
        status: 'active',
      })
      .select(RECURRING_SELECT)
      .single();
    if (insertError || !data) throw new Error(getThaiErrorMessage(insertError, 'เพิ่มรายการประจำไม่สำเร็จ'));
    await processDueRecurringTransactions().catch(() => 0);
    return normalizeRecurring(data as RecurringTransactionRow);
  }, [processDueRecurringTransactions]);

  const updateRecurringTransaction = useCallback(async (id: string, formData: RecurringTransactionFormData) => {
    const user = await getAuthenticatedUser();
    const existing = recurringTransactions.find((item) => item.id === id);
    const dayOfMonth = Number(formData.day_of_month);
    const startMonth = toMonthStart(formData.start_month);
    const nextRunDate = existing?.status === 'active'
      ? getNextEligibleDate(startMonth, dayOfMonth)
      : existing?.next_run_date ?? getRecurringRunDate(startMonth, dayOfMonth);
    const { data, error: updateError } = await supabase
      .from('recurring_transactions')
      .update({
        name: formData.name.trim(),
        type: formData.type,
        amount: Number(formData.amount),
        category_id: formData.category_id,
        category: formData.category,
        day_of_month: dayOfMonth,
        start_month: startMonth,
        next_run_date: nextRunDate,
        note: formData.note.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select(RECURRING_SELECT)
      .single();
    if (updateError || !data) throw new Error(getThaiErrorMessage(updateError, 'แก้ไขรายการประจำไม่สำเร็จ'));
    await processDueRecurringTransactions().catch(() => 0);
    return normalizeRecurring(data as RecurringTransactionRow);
  }, [processDueRecurringTransactions, recurringTransactions]);

  const setRecurringStatus = useCallback(async (id: string, status: RecurringTransactionStatus) => {
    const user = await getAuthenticatedUser();
    const existing = recurringTransactions.find((item) => item.id === id);
    const nextRunDate = status === 'active' && existing
      ? getNextEligibleDate(existing.start_month, existing.day_of_month)
      : existing?.next_run_date;
    const { data, error: updateError } = await supabase
      .from('recurring_transactions')
      .update({ status, next_run_date: nextRunDate, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select(RECURRING_SELECT)
      .single();
    if (updateError || !data) throw new Error(getThaiErrorMessage(updateError, 'เปลี่ยนสถานะรายการประจำไม่สำเร็จ'));
    if (status === 'active') await processDueRecurringTransactions().catch(() => 0);
    return normalizeRecurring(data as RecurringTransactionRow);
  }, [processDueRecurringTransactions, recurringTransactions]);

  return {
    recurringTransactions,
    loading,
    error,
    fetchRecurringTransactions,
    addRecurringTransaction,
    updateRecurringTransaction,
    setRecurringStatus,
    processDueRecurringTransactions,
  };
}
