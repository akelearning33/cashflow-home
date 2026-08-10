import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Plus, RotateCcw } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Dashboard } from '../components/Dashboard';
import { TransactionDialog } from '../components/TransactionDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PeriodNavigator } from '../components/PeriodNavigator';
import { useToast } from '../hooks/useToast';
import { useTransactions } from '../hooks/useTransactions';
import { formatCurrency } from '../utils/formatCurrency';
import { getPeriodFromDate } from '../utils/period';
import { getThaiErrorMessage } from '../utils/errors';
import type { Transaction } from '../types';

const Chart = lazy(() => import('../components/Chart').then((module) => ({ default: module.Chart })));

export function DashboardPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();
  const { transactions, loading, error, fetchYearTransactions, softDeleteTransaction, restoreTransaction } = useTransactions();

  useEffect(() => {
    void fetchYearTransactions(year);
  }, [fetchYearTransactions, year]);

  const monthlyTransactions = useMemo(
    () => transactions.filter((transaction) => Number(transaction.date.slice(5, 7)) === month),
    [month, transactions]
  );

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
    await fetchYearTransactions(period.year);
    showToast(editingTransaction ? 'บันทึกการแก้ไขแล้ว' : 'เพิ่มรายการแล้ว');
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleting(true);
    try {
      await softDeleteTransaction(target.id);
      setDeleteTarget(null);
      await fetchYearTransactions(year);
      showToast('ลบรายการแล้ว', { actionLabel: 'เลิกทำ', onAction: async () => { await restoreTransaction(target.id); await fetchYearTransactions(year); showToast('กู้คืนรายการแล้ว'); } });
    } catch (deleteError) {
      showToast(getThaiErrorMessage(deleteError, 'ลบรายการไม่สำเร็จ'), { tone: 'error' });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 sm:pb-0">
      <Navbar />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-2xl font-black tracking-tight text-slate-900">ภาพรวมการเงิน</h1><p className="mt-1 text-sm text-slate-500">ดูสถานะและรายการสำคัญของเดือน</p></div>
          <div className="flex flex-wrap items-center gap-2"><PeriodNavigator year={year} month={month} onChange={(nextYear, nextMonth) => { setYear(nextYear); setMonth(nextMonth); }} /><button type="button" onClick={openAdd} className="hidden min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/15 hover:bg-indigo-700 sm:flex"><Plus size={18} /> เพิ่มรายการ</button></div>
        </div>

        {loading && <div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className={`h-44 animate-pulse rounded-3xl bg-slate-200 ${index === 0 ? 'md:col-span-2' : ''}`} />)}</div>}
        {!loading && error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center"><p className="text-sm font-medium text-rose-700">{error}</p><button type="button" onClick={() => void fetchYearTransactions(year)} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-rose-700"><RotateCcw size={16} /> ลองใหม่</button></div>}
        {!loading && !error && <Dashboard transactions={monthlyTransactions} onEdit={openEdit} onDelete={setDeleteTarget} onAdd={openAdd} />}

        {!loading && !error && <Suspense fallback={<div className="h-72 animate-pulse rounded-2xl bg-slate-200" />}><Chart year={year} highlightedMonth={month} transactions={transactions} /></Suspense>}
      </main>

      <TransactionDialog open={dialogOpen} year={year} month={month} transaction={editingTransaction} onClose={() => { setDialogOpen(false); setEditingTransaction(null); }} onSaved={handleSaved} />
      <ConfirmDialog open={Boolean(deleteTarget)} title="ลบรายการนี้หรือไม่?" description={deleteTarget ? `${deleteTarget.category} จำนวน ${formatCurrency(deleteTarget.amount)} จะถูกซ่อน และสามารถเลิกทำได้หลังลบ` : ''} confirmLabel="ลบรายการ" loading={deleting} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
    </div>
  );
}
