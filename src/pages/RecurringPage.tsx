import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Check, Pause, Pencil, Plus, Repeat, X } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { RecurringTransactionForm } from '../components/RecurringTransactionForm';
import { useCategories } from '../hooks/useCategories';
import { useRecurringTransactions } from '../hooks/useRecurringTransactions';
import { useToast } from '../hooks/useToast';
import type { RecurringTransaction, RecurringTransactionFormData, RecurringTransactionStatus } from '../types';
import { formatDate, formatMonthYear } from '../utils/formatDate';
import { getThaiErrorMessage } from '../utils/errors';
import { AppDialog } from '../components/AppDialog';
import { CurrencyAmount } from '../components/CurrencyAmount';

function statusLabel(status: RecurringTransactionStatus) {
  if (status === 'paused') return 'พักไว้';
  if (status === 'cancelled') return 'ยกเลิกแล้ว';
  return 'กำลังทำงาน';
}

function statusClass(status: RecurringTransactionStatus) {
  if (status === 'paused') return 'bg-amber-50 text-amber-700';
  if (status === 'cancelled') return 'bg-slate-100 text-slate-500';
  return 'bg-emerald-50 text-emerald-700';
}

export function RecurringPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);
  const [cancelTarget, setCancelTarget] = useState<RecurringTransaction | null>(null);
  const [changingId, setChangingId] = useState<string | null>(null);
  const { categories, loading: categoriesLoading, fetchCategories } = useCategories();
  const {
    recurringTransactions,
    loading,
    error,
    fetchRecurringTransactions,
    addRecurringTransaction,
    updateRecurringTransaction,
    setRecurringStatus,
  } = useRecurringTransactions();
  const { showToast } = useToast();

  useEffect(() => {
    void fetchCategories();
    void fetchRecurringTransactions();
  }, [fetchCategories, fetchRecurringTransactions]);

  const activeCount = useMemo(
    () => recurringTransactions.filter((recurring) => recurring.status === 'active').length,
    [recurringTransactions]
  );

  function openCreate() {
    setEditingRecurring(null);
    setFormOpen(true);
  }

  function openEdit(recurring: RecurringTransaction) {
    setEditingRecurring(recurring);
    setFormOpen(true);
  }

  async function saveRecurring(data: RecurringTransactionFormData) {
    if (editingRecurring) {
      await updateRecurringTransaction(editingRecurring.id, data);
      showToast('บันทึกการแก้ไขรายการประจำแล้ว');
    } else {
      await addRecurringTransaction(data);
      showToast('เพิ่มรายการประจำแล้ว');
    }
    setFormOpen(false);
    setEditingRecurring(null);
    await fetchRecurringTransactions();
  }

  async function changeStatus(recurring: RecurringTransaction, status: RecurringTransactionStatus) {
    setChangingId(recurring.id);
    try {
      await setRecurringStatus(recurring.id, status);
      await fetchRecurringTransactions();
      showToast(status === 'active' ? 'เปิดรายการประจำแล้ว' : status === 'paused' ? 'พักรายการประจำแล้ว' : 'ยกเลิกรายการประจำแล้ว');
      if (status === 'cancelled') setCancelTarget(null);
    } catch (statusError) {
      showToast(getThaiErrorMessage(statusError, 'เปลี่ยนสถานะไม่สำเร็จ'), { tone: 'error' });
    } finally {
      setChangingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 sm:pb-0">
      <Navbar />
      <main className="mx-auto max-w-4xl space-y-4 px-4 py-4 sm:space-y-5 sm:py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">รายการประจำ</h1>
            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">จัดการรายการที่สร้างซ้ำตามกำหนดรายเดือน</p>
          </div>
          <button type="button" onClick={openCreate} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/15 hover:bg-indigo-700"><Plus size={18} /> เพิ่มรายการประจำ</button>
        </div>

        <section className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3" aria-label="สรุปรายการประจำ"><p className="text-sm font-medium text-slate-700">กำลังทำงาน <span className="font-semibold text-indigo-800">{activeCount} รายการ</span></p><details className="text-sm"><summary className="min-h-10 cursor-pointer rounded-lg px-2 py-2 font-medium text-indigo-700 hover:bg-indigo-50">วิธีทำงาน</summary><div className="mt-2 space-y-2 border-t border-slate-100 pt-3 text-sm leading-6 text-slate-700 sm:max-w-md"><p>สร้างรายการทุกวัน 00:05 น. เวลาไทย และเมื่อเปิดหน้านี้</p><p>กำหนดวันที่ 29–31 ระบบใช้วันสุดท้ายของเดือน</p></div></details></section>

        {loading && <div className="space-y-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="h-40 animate-pulse rounded-2xl bg-slate-200" />)}</div>}
        {!loading && error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center"><p className="text-sm font-medium text-rose-700">{error}</p><button type="button" onClick={() => void fetchRecurringTransactions()} className="mt-3 min-h-11 rounded-xl bg-white px-4 text-sm font-bold text-rose-700">ลองใหม่</button></div>}
        {!loading && !error && recurringTransactions.length === 0 && <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600"><Repeat size={27} /></span><h2 className="mt-4 font-bold text-slate-800">ยังไม่มีรายการประจำ</h2><p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">เพิ่มค่าเช่า เงินเดือน ค่ามือถือ หรือรายการคงที่อื่น ๆ เพื่อไม่ต้องกรอกซ้ำทุกเดือน</p><button type="button" onClick={openCreate} className="mt-5 min-h-11 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white">เพิ่มรายการแรก</button></section>}

        {!loading && !error && recurringTransactions.length > 0 && <section className="space-y-3" aria-label="รายการประจำทั้งหมด">{recurringTransactions.map((recurring) => <article key={recurring.id} className={`rounded-2xl border bg-white p-4 sm:p-5 ${recurring.status === 'cancelled' ? 'border-slate-200 opacity-70' : 'border-slate-200'}`}>
          <div className="flex items-start gap-3">
            <span className={`mt-0.5 grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl ${recurring.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}><Repeat size={20} /></span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-semibold text-slate-900">{recurring.name}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(recurring.status)}`}>{statusLabel(recurring.status)}</span></div>
              <p className="mt-1 text-sm text-slate-600">{recurring.type === 'income' ? 'รายรับ' : 'รายจ่าย'} · {recurring.category}</p>
            </div>
            <CurrencyAmount amount={recurring.amount} sign={recurring.type === 'income' ? 'positive' : 'negative'} className={`flex-shrink-0 text-base font-semibold sm:text-lg ${recurring.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`} />
          </div>
          <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 text-sm text-slate-600 sm:grid-cols-3">
            <p className="flex items-center gap-2"><CalendarClock size={16} className="text-slate-600" />ทุกวันที่ {recurring.day_of_month}</p>
            <p className="flex items-center gap-2"><Check size={16} className="text-slate-600" />เริ่ม {formatMonthYear(Number(recurring.start_month.slice(0, 4)), Number(recurring.start_month.slice(5, 7)))}</p>
            <p className="text-slate-700">{recurring.status === 'active' ? `ครั้งถัดไป ${formatDate(recurring.next_run_date)}` : 'ไม่มีการสร้างรายการใหม่'}</p>
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            {recurring.status !== 'cancelled' && <button type="button" onClick={() => openEdit(recurring)} disabled={changingId === recurring.id} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50"><Pencil size={15} /> แก้ไข</button>}
            {recurring.status === 'active' && <button type="button" onClick={() => void changeStatus(recurring, 'paused')} disabled={changingId === recurring.id} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-amber-200 px-3 text-sm font-bold text-amber-700 hover:bg-amber-50 disabled:opacity-50"><Pause size={15} /> พักไว้</button>}
            {recurring.status === 'paused' && <button type="button" onClick={() => void changeStatus(recurring, 'active')} disabled={changingId === recurring.id} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-emerald-200 px-3 text-sm font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"><Check size={15} /> เปิดใช้งาน</button>}
            {recurring.status !== 'cancelled' && <button type="button" onClick={() => setCancelTarget(recurring)} disabled={changingId === recurring.id} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-rose-200 px-3 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"><X size={15} /> ยกเลิก</button>}
          </div>
        </article>)}</section>}
      </main>

      <AppDialog open={formOpen} titleId="recurring-dialog-title" title={editingRecurring ? 'แก้ไขรายการประจำ' : 'เพิ่มรายการประจำ'} description="ระบบบันทึกรายการจริงตามวันที่และนำไปรวมในภาพรวมอัตโนมัติ" onClose={() => setFormOpen(false)}>
        {formOpen && <div className="p-4 sm:p-5"><RecurringTransactionForm key={editingRecurring?.id ?? 'new'} initialRecurring={editingRecurring} categories={categories} categoriesLoading={categoriesLoading} onSubmit={saveRecurring} onCancel={() => setFormOpen(false)} /></div>}
      </AppDialog>

      <ConfirmDialog open={Boolean(cancelTarget)} title="ยกเลิกรายการประจำนี้หรือไม่?" description={cancelTarget ? `ระบบจะไม่สร้างงวดใหม่ของ “${cancelTarget.name}” แต่รายการที่สร้างไปแล้วจะยังอยู่ในประวัติ` : ''} confirmLabel="ยกเลิกรายการประจำ" loading={Boolean(cancelTarget && changingId === cancelTarget.id)} onClose={() => setCancelTarget(null)} onConfirm={() => cancelTarget ? changeStatus(cancelTarget, 'cancelled') : undefined} />
    </div>
  );
}
