import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Plus, Printer, RotateCcw } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Dashboard } from '../components/Dashboard';
import { TransactionDialog } from '../components/TransactionDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ReportDialog } from '../components/ReportDialog';
import { PeriodNavigator } from '../components/PeriodNavigator';
import { useToast } from '../hooks/useToast';
import { useTransactions } from '../hooks/useTransactions';
import { CurrencyAmount } from '../components/CurrencyAmount';
import { useSelectedPeriod } from '../hooks/useSelectedPeriod';
import { formatCurrency } from '../utils/formatCurrency';
import { getPeriodFromDate } from '../utils/period';
import { getThaiErrorMessage } from '../utils/errors';
import type { Transaction } from '../types';

const Chart = lazy(() => import('../components/Chart').then((module) => ({ default: module.Chart })));

export function DashboardPage() {
  const { year, month, setPeriod } = useSelectedPeriod();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
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
  const yearlyTotals = useMemo(
    () => transactions.reduce(
      (totals, transaction) => {
        totals[transaction.type] += Number(transaction.amount);
        return totals;
      },
      { income: 0, expense: 0 }
    ),
    [transactions]
  );
  const yearlyNet = yearlyTotals.income - yearlyTotals.expense;

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
    setPeriod(period.year, period.month);
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
      <main className="mx-auto max-w-6xl space-y-5 px-4 py-4 sm:space-y-6 sm:py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">ภาพรวมการเงิน</h1><p className="mt-1 text-sm text-slate-500">รายรับ รายจ่าย และรายการสำคัญ</p></div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto"><PeriodNavigator year={year} month={month} onChange={setPeriod} /><button type="button" onClick={() => setReportOpen(true)} disabled={loading || Boolean(error)} aria-label="พิมพ์หรือบันทึกรายงาน PDF" className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"><Printer size={17} /><span className="hidden sm:inline">รายงาน</span></button><button type="button" onClick={openAdd} className="hidden min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 sm:flex"><Plus size={18} /> เพิ่มรายการ</button></div>
        </div>

        {loading && <div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className={`h-44 animate-pulse rounded-3xl bg-slate-200 ${index === 0 ? 'md:col-span-2' : ''}`} />)}</div>}
        {!loading && error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center"><p className="text-sm font-medium text-rose-700">{error}</p><button type="button" onClick={() => void fetchYearTransactions(year)} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-rose-700"><RotateCcw size={16} /> ลองใหม่</button></div>}
        {!loading && !error && <Dashboard transactions={monthlyTransactions} year={year} month={month} onEdit={openEdit} onDelete={setDeleteTarget} onAdd={openAdd} />}

        {!loading && !error && (
          <details className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-semibold text-slate-800"><span>ภาพรวมทั้งปี ค.ศ. {year}</span><span className="text-xs font-medium text-indigo-700">ดูยอดรายปี</span></summary>
            <div className="border-t border-slate-100 p-4 sm:p-5">
              <section className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 md:grid-cols-3" aria-label="สรุปยอดรายปี">
                <article className="rounded-xl bg-slate-50 p-3 sm:p-4"><p className="text-xs font-medium text-slate-600">สุทธิทั้งปี</p><CurrencyAmount amount={yearlyNet} sign={yearlyNet >= 0 ? 'positive' : 'negative'} className={`mt-2 block text-lg font-bold sm:text-xl ${yearlyNet >= 0 ? 'text-emerald-700' : 'text-rose-700'}`} /></article>
                <article className="rounded-xl bg-emerald-50 p-3 sm:p-4"><p className="text-xs font-medium text-emerald-800">รายรับทั้งปี</p><CurrencyAmount amount={yearlyTotals.income} sign="positive" className="mt-2 block text-lg font-bold text-emerald-700 sm:text-xl" /></article>
                <article className="rounded-xl bg-rose-50 p-3 sm:p-4"><p className="text-xs font-medium text-rose-800">รายจ่ายทั้งปี</p><CurrencyAmount amount={yearlyTotals.expense} sign="negative" className="mt-2 block text-lg font-bold text-rose-700 sm:text-xl" /></article>
              </section>
              <div className="mt-4"><Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-slate-100" />}><Chart year={year} highlightedMonth={month} transactions={transactions} /></Suspense></div>
            </div>
          </details>
        )}
      </main>

      <TransactionDialog open={dialogOpen} year={year} month={month} transaction={editingTransaction} onClose={() => { setDialogOpen(false); setEditingTransaction(null); }} onSaved={handleSaved} />
      <ConfirmDialog open={Boolean(deleteTarget)} title="ลบรายการนี้หรือไม่?" description={deleteTarget ? `${deleteTarget.category} จำนวน ${formatCurrency(deleteTarget.amount)} จะถูกซ่อน และสามารถเลิกทำได้หลังลบ` : ''} confirmLabel="ลบรายการ" loading={deleting} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
      <ReportDialog open={reportOpen} year={year} month={month} transactions={transactions} allowYear onClose={() => setReportOpen(false)} />
    </div>
  );
}
