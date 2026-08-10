import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Tags, Rows3, RotateCcw } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { TransactionItem } from '../components/TransactionItem';
import { TransactionDialog } from '../components/TransactionDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PeriodNavigator } from '../components/PeriodNavigator';
import { useToast } from '../hooks/useToast';
import { useTransactions } from '../hooks/useTransactions';
import { formatCurrency } from '../utils/formatCurrency';
import { formatLongDate } from '../utils/formatDate';
import { getCategoryColor } from '../utils/categoryColors';
import { getPeriodFromDate } from '../utils/period';
import { getThaiErrorMessage } from '../utils/errors';
import type { Transaction, TransactionType } from '../types';

type FilterType = TransactionType | 'all';
type ViewMode = 'list' | 'category';

export function TransactionsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const { transactions, loading, error, fetchTransactions, softDeleteTransaction, restoreTransaction } = useTransactions();

  useEffect(() => {
    void fetchTransactions(year, month, 'all');
  }, [fetchTransactions, month, year]);

  useEffect(() => {
    if (searchParams.get('add') !== '1') return;
    setEditingTransaction(null);
    setDialogOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete('add');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const categoryOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const transaction of transactions) {
      const key = transaction.category_id ?? `legacy:${transaction.type}:${transaction.category}`;
      map.set(key, transaction.category);
    }
    return Array.from(map, ([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label, 'th'));
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('th');
    return transactions.filter((transaction) => {
      const categoryKey = transaction.category_id ?? `legacy:${transaction.type}:${transaction.category}`;
      return (typeFilter === 'all' || transaction.type === typeFilter)
        && (categoryFilter === 'all' || categoryKey === categoryFilter)
        && (!query || transaction.category.toLocaleLowerCase('th').includes(query) || transaction.note?.toLocaleLowerCase('th').includes(query));
    });
  }, [categoryFilter, search, transactions, typeFilter]);

  const groupedByDate = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const transaction of filteredTransactions) {
      map.set(transaction.date, [...(map.get(transaction.date) ?? []), transaction]);
    }
    return Array.from(map.entries());
  }, [filteredTransactions]);

  const categorySummary = useMemo(() => {
    const map = new Map<string, { name: string; type: TransactionType; amount: number; count: number }>();
    for (const transaction of filteredTransactions) {
      const key = `${transaction.type}:${transaction.category_id ?? transaction.category}`;
      const current = map.get(key) ?? { name: transaction.category, type: transaction.type, amount: 0, count: 0 };
      current.amount += Number(transaction.amount);
      current.count += 1;
      map.set(key, current);
    }
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions]);

  const totals = useMemo(() => filteredTransactions.reduce((sum, transaction) => {
    if (transaction.type === 'income') sum.income += Number(transaction.amount);
    else sum.expense += Number(transaction.amount);
    return sum;
  }, { income: 0, expense: 0 }), [filteredTransactions]);

  function openAdd() {
    setEditingTransaction(null);
    setDialogOpen(true);
  }

  function openEdit(transaction: Transaction) {
    setEditingTransaction(transaction);
    setDialogOpen(true);
  }

  async function handleSaved(transaction: Transaction) {
    const period = getPeriodFromDate(transaction.date);
    setYear(period.year);
    setMonth(period.month);
    setDialogOpen(false);
    setEditingTransaction(null);
    await fetchTransactions(period.year, period.month, 'all');
    showToast(editingTransaction ? 'บันทึกการแก้ไขแล้ว' : 'เพิ่มรายการแล้ว');
    window.setTimeout(() => document.getElementById(`transaction-${transaction.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleting(true);
    try {
      await softDeleteTransaction(target.id);
      setDeleteTarget(null);
      await fetchTransactions(year, month, 'all');
      showToast('ลบรายการแล้ว', {
        actionLabel: 'เลิกทำ',
        onAction: async () => {
          await restoreTransaction(target.id);
          await fetchTransactions(year, month, 'all');
          showToast('กู้คืนรายการแล้ว');
        },
      });
    } catch (deleteError) {
      showToast(getThaiErrorMessage(deleteError, 'ลบรายการไม่สำเร็จ'), { tone: 'error' });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 sm:pb-0">
      <Navbar />
      <main className="mx-auto max-w-4xl space-y-5 px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">รายการรับ–จ่าย</h1>
            <p className="mt-1 text-sm text-slate-500">ค้นหา แก้ไข และตรวจสอบรายการของคุณ</p>
          </div>
          <button type="button" onClick={openAdd} className="hidden min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/15 hover:bg-indigo-700 sm:flex">
            <Plus size={18} /> เพิ่มรายการ
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <PeriodNavigator year={year} month={month} onChange={(nextYear, nextMonth) => { setYear(nextYear); setMonth(nextMonth); }} />
          <div className="grid grid-cols-2 rounded-xl bg-slate-200/70 p-1">
            <button type="button" onClick={() => setViewMode('list')} className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold ${viewMode === 'list' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`} aria-pressed={viewMode === 'list'}><Rows3 size={16} /> รายการ</button>
            <button type="button" onClick={() => setViewMode('category')} className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold ${viewMode === 'category' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`} aria-pressed={viewMode === 'category'}><Tags size={16} /> ตามหมวด</button>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" aria-label="ตัวกรองรายการ">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <label className="relative block">
              <span className="sr-only">ค้นหารายการ</span>
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" placeholder="ค้นหาหมวดหมู่หรือหมายเหตุ" />
            </label>
            <select aria-label="กรองประเภทรายการ" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as FilterType)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100">
              <option value="all">รับ–จ่ายทั้งหมด</option><option value="expense">รายจ่าย</option><option value="income">รายรับ</option>
            </select>
            <select aria-label="กรองหมวดหมู่" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100">
              <option value="all">ทุกหมวดหมู่</option>{categoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-3 gap-3 border-b border-slate-100 p-4 text-center">
            <div><p className="text-xs text-slate-400">รายรับ</p><p className="mt-1 text-sm font-extrabold text-emerald-600">+{formatCurrency(totals.income)}</p></div>
            <div><p className="text-xs text-slate-400">รายจ่าย</p><p className="mt-1 text-sm font-extrabold text-rose-600">−{formatCurrency(totals.expense)}</p></div>
            <div><p className="text-xs text-slate-400">สุทธิ</p><p className={`mt-1 text-sm font-extrabold ${totals.income - totals.expense >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(totals.income - totals.expense)}</p></div>
          </div>

          {loading && <div className="space-y-3 p-4">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div>}
          {!loading && error && <div className="p-6 text-center"><p className="text-sm font-medium text-rose-700">{error}</p><button type="button" onClick={() => void fetchTransactions(year, month, 'all')} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-rose-50 px-4 text-sm font-bold text-rose-700"><RotateCcw size={16} /> ลองใหม่</button></div>}
          {!loading && !error && filteredTransactions.length === 0 && <div className="px-6 py-14 text-center"><p className="font-bold text-slate-700">ยังไม่พบรายการ</p><p className="mt-1 text-sm text-slate-400">ลองเปลี่ยนตัวกรอง หรือเพิ่มรายการแรกของเดือนนี้</p><button type="button" onClick={openAdd} className="mt-4 min-h-11 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white"><Plus size={17} className="mr-1 inline" /> เพิ่มรายการ</button></div>}

          {!loading && !error && filteredTransactions.length > 0 && viewMode === 'list' && <div>{groupedByDate.map(([date, items]) => <div key={date} className="border-b border-slate-100 last:border-0"><div className="flex items-center justify-between bg-slate-50 px-4 py-2"><h2 className="text-xs font-bold text-slate-600">{formatLongDate(date)}</h2><span className="text-xs text-slate-400">{items.length} รายการ</span></div><div className="divide-y divide-slate-50 px-1">{items.map((transaction) => <TransactionItem key={transaction.id} transaction={transaction} onEdit={openEdit} onDelete={setDeleteTarget} compact />)}</div></div>)}</div>}

          {!loading && !error && filteredTransactions.length > 0 && viewMode === 'category' && <div className="divide-y divide-slate-100 p-2">{categorySummary.map((summary, index) => <div key={`${summary.type}:${summary.name}`} className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-slate-50"><span className="h-10 w-10 rounded-full" style={{ backgroundColor: getCategoryColor(summary.name, index) }} aria-hidden="true" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-800">{summary.name}</p><p className="text-xs text-slate-400">{summary.count} รายการ · {summary.type === 'income' ? 'รายรับ' : 'รายจ่าย'}</p></div><p className={`text-sm font-extrabold ${summary.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>{summary.type === 'income' ? '+' : '−'}{formatCurrency(summary.amount)}</p></div>)}</div>}
        </section>
      </main>

      <TransactionDialog open={dialogOpen} year={year} month={month} transaction={editingTransaction} onClose={() => { setDialogOpen(false); setEditingTransaction(null); }} onSaved={handleSaved} />
      <ConfirmDialog open={Boolean(deleteTarget)} title="ลบรายการนี้หรือไม่?" description={deleteTarget ? `${deleteTarget.category} จำนวน ${formatCurrency(deleteTarget.amount)} จะถูกซ่อน และสามารถเลิกทำได้หลังลบ` : ''} confirmLabel="ลบรายการ" loading={deleting} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
    </div>
  );
}
