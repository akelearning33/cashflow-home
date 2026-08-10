import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock3, Save } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import type { Transaction, TransactionType } from '../types';
import { getDefaultDateForPeriod } from '../utils/period';
import { getThaiErrorMessage } from '../utils/errors';

interface Props {
  defaultYear: number;
  defaultMonth: number;
  initialTransaction?: Transaction | null;
  onSuccess: (transaction: Transaction) => void;
  onCancel: () => void;
}

function recentStorageKey(type: TransactionType) {
  return `cashflow:recent-categories:${type}`;
}

export function TransactionForm({ defaultYear, defaultMonth, initialTransaction, onSuccess, onCancel }: Props) {
  const { addTransaction, updateTransaction } = useTransactions();
  const { categories, loading: categoriesLoading, fetchCategories } = useCategories();
  const [type, setType] = useState<TransactionType>(initialTransaction?.type ?? 'expense');
  const [amount, setAmount] = useState(initialTransaction ? String(initialTransaction.amount) : '');
  const [categoryId, setCategoryId] = useState(initialTransaction?.category_id ?? '');
  const [date, setDate] = useState(initialTransaction?.date ?? getDefaultDateForPeriod(defaultYear, defaultMonth));
  const [note, setNote] = useState(initialTransaction?.note ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(recentStorageKey(type)) ?? '[]') as unknown;
      setRecentIds(Array.isArray(stored) ? stored.filter((id): id is string => typeof id === 'string').slice(0, 3) : []);
    } catch {
      setRecentIds([]);
    }
  }, [type]);

  const availableCategories = useMemo(
    () => categories.filter((category) => category.type === type && (category.is_active || category.id === categoryId)),
    [categories, categoryId, type]
  );
  const systemCategories = availableCategories.filter((category) => category.user_id === null);
  const customCategories = availableCategories.filter((category) => category.user_id !== null);
  const recentCategories = recentIds
    .map((id) => availableCategories.find((category) => category.id === id && category.is_active))
    .filter((category): category is NonNullable<typeof category> => Boolean(category));

  function changeType(nextType: TransactionType) {
    setType(nextType);
    setCategoryId('');
    setError('');
  }

  function rememberCategory(id: string) {
    const next = [id, ...recentIds.filter((recentId) => recentId !== id)].slice(0, 3);
    setRecentIds(next);
    try {
      localStorage.setItem(recentStorageKey(type), JSON.stringify(next));
    } catch {
      // Recent shortcuts are optional when storage is unavailable.
    }
  }

  async function handleSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    setError('');
    const parsedAmount = Number(amount);
    const selectedCategory = availableCategories.find((category) => category.id === categoryId);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('จำนวนเงินต้องมากกว่า 0');
      return;
    }
    if (!selectedCategory) {
      setError('กรุณาเลือกหมวดหมู่');
      return;
    }
    if (!date) {
      setError('กรุณาเลือกวันที่');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        type,
        amount: String(parsedAmount),
        category_id: selectedCategory.id,
        category: selectedCategory.name,
        date,
        note,
      };
      const saved = initialTransaction
        ? await updateTransaction(initialTransaction.id, payload)
        : await addTransaction(payload);
      rememberCategory(selectedCategory.id);
      onSuccess(saved);
    } catch (saveError) {
      setError(getThaiErrorMessage(saveError, initialTransaction ? 'แก้ไขรายการไม่สำเร็จ' : 'เพิ่มรายการไม่สำเร็จ'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1" aria-label="ประเภทรายการ">
        <button type="button" onClick={() => changeType('expense')} className={`min-h-11 rounded-lg text-sm font-bold transition-colors ${type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`} aria-pressed={type === 'expense'}>
          รายจ่าย
        </button>
        <button type="button" onClick={() => changeType('income')} className={`min-h-11 rounded-lg text-sm font-bold transition-colors ${type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`} aria-pressed={type === 'income'}>
          รายรับ
        </button>
      </div>

      <div>
        <label htmlFor="transaction-amount" className="mb-1.5 block text-sm font-semibold text-slate-700">จำนวนเงิน</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">฿</span>
          <input id="transaction-amount" autoFocus type="number" inputMode="decimal" min="0.01" step="0.01" required value={amount} onChange={(event) => setAmount(event.target.value)} className="min-h-14 w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-2xl font-extrabold text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" placeholder="0.00" />
        </div>
      </div>

      {recentCategories.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400"><Clock3 size={13} /> ใช้ล่าสุด</p>
          <div className="flex flex-wrap gap-2">
            {recentCategories.map((category) => (
              <button key={category.id} type="button" onClick={() => setCategoryId(category.id)} className={`min-h-11 rounded-full border px-4 text-sm font-semibold ${categoryId === category.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                {category.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="transaction-category" className="text-sm font-semibold text-slate-700">หมวดหมู่</label>
          <Link to="/categories" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">จัดการหมวดหมู่</Link>
        </div>
        <select id="transaction-category" required value={categoryId} onChange={(event) => setCategoryId(event.target.value)} disabled={categoriesLoading} className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:opacity-60">
          <option value="">{categoriesLoading ? 'กำลังโหลด…' : 'เลือกหมวดหมู่'}</option>
          {systemCategories.length > 0 && <optgroup label="หมวดหมู่มาตรฐาน">{systemCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</optgroup>}
          {customCategories.length > 0 && <optgroup label="หมวดหมู่ของฉัน">{customCategories.map((category) => <option key={category.id} value={category.id}>{category.name}{category.is_active ? '' : ' (เก็บถาวร)'}</option>)}</optgroup>}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="transaction-date" className="mb-1.5 block text-sm font-semibold text-slate-700">วันที่</label>
          <input id="transaction-date" type="date" required value={date} onChange={(event) => setDate(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" />
        </div>
        <div>
          <label htmlFor="transaction-note" className="mb-1.5 block text-sm font-semibold text-slate-700">หมายเหตุ <span className="font-normal text-slate-400">(ไม่บังคับ)</span></label>
          <input id="transaction-note" type="text" value={note} onChange={(event) => setNote(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" placeholder="เช่น มื้อกลางวัน" maxLength={200} />
        </div>
      </div>

      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">{error}</p>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} disabled={saving} className="min-h-12 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">ยกเลิก</button>
        <button type="submit" disabled={saving || categoriesLoading} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-bold text-white shadow-lg shadow-indigo-600/15 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
          <Save size={17} /> {saving ? 'กำลังบันทึก…' : initialTransaction ? 'บันทึกการแก้ไข' : 'เพิ่มรายการ'}
        </button>
      </div>
    </form>
  );
}
