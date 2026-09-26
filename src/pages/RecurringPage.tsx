import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Check, Pause, Pencil, Plus, Repeat, X } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { RecurringTransactionForm } from '../components/RecurringTransactionForm';
import { useCategories } from '../hooks/useCategories';
import { useRecurringTransactions } from '../hooks/useRecurringTransactions';
import { useToast } from '../hooks/useToast';
import type { RecurringTransaction, RecurringTransactionFormData, RecurringTransactionStatus } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate, formatMonthYear } from '../utils/formatDate';
import { getThaiErrorMessage } from '../utils/errors';

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
      <main className="mx-auto max-w-4xl space-y-5 px-4 py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">รายการประจำ</h1>
            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">ตั้งรายรับหรือรายจ่ายที่เกิดขึ้นทุกเดือน ระบบจะบันทึกเป็นรายการจริงให้อัตโนมัติเมื่อถึงกำหนด</p>
          </div>
          <button type="button" onClick={openCreate} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/15 hover:bg-indigo-700"><Plus size={18} /> เพิ่มรายการประจำ</button>
        </div>

        <section className="grid gap-3 sm:grid-cols-3" aria-label="สรุปรายการประจำ">
          <article className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4"><p className="text-xs font-bold uppercase tracking-widest text-indigo-500">รายการที่ทำงานอยู่</p><p className="mt-2 text-2xl font-black text-indigo-700">{activeCount}</p></article>
          <article className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><p className="text-xs font-bold uppercase tracking-widest text-emerald-600">สร้างอัตโนมัติ</p><p className="mt-2 text-sm font-bold leading-6 text-emerald-800">ทุกวัน 00:05 น. เวลาไทย และเมื่อเปิดหน้านี้</p></article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase tracking-widest text-slate-500">วันสิ้นเดือน</p><p className="mt-2 text-sm font-bold leading-6 text-slate-700">วันที่ 29–31 ใช้วันสุดท้ายของเดือน</p></article>
        </section>

        {loading && <div className="space-y-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="h-40 animate-pulse rounded-2xl bg-slate-200" />)}</div>}
        {!loading && error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center"><p className="text-sm font-medium text-rose-700">{error}</p><button type="button" onClick={() => void fetchRecurringTransactions()} className="mt-3 min-h-11 rounded-xl bg-white px-4 text-sm font-bold text-rose-700">ลองใหม่</button></div>}
        {!loading && !error && recurringTransactions.length === 0 && <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600"><Repeat size={27} /></span><h2 className="mt-4 font-bold text-slate-800">ยังไม่มีรายการประจำ</h2><p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">เพิ่มค่าเช่า เงินเดือน ค่ามือถือ หรือรายการคงที่อื่น ๆ เพื่อไม่ต้องกรอกซ้ำทุกเดือน</p><button type="button" onClick={openCreate} className="mt-5 min-h-11 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white">เพิ่มรายการแรก</button></section>}

        {!loading && !error && recurringTransactions.length > 0 && <section className="space-y-3" aria-label="รายการประจำทั้งหมด">{recurringTransactions.map((recurring) => <article key={recurring.id} className={`rounded-2xl border bg-white p-4 shadow-sm sm:p-5 ${recurring.status === 'cancelled' ? 'border-slate-200 opacity-70' : 'border-slate-200'}`}>
          <div className="flex items-start gap-3">
            <span className={`mt-0.5 grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl ${recurring.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}><Repeat size={20} /></span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-extrabold text-slate-900">{recurring.name}</h2><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClass(recurring.status)}`}>{statusLabel(recurring.status)}</span></div>
              <p className="mt-1 text-sm text-slate-500">{recurring.type === 'income' ? 'รายรับ' : 'รายจ่าย'} · หมวดหมู่ {recurring.category}</p>
            </div>
            <p className={`flex-shrink-0 text-lg font-black ${recurring.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>{recurring.type === 'income' ? '+' : '−'}{formatCurrency(recurring.amount)}</p>
          </div>
          <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 text-sm text-slate-600 sm:grid-cols-3">
            <p className="flex items-center gap-2"><CalendarClock size={16} className="text-slate-400" />ทุกวันที่ {recurring.day_of_month}</p>
            <p className="flex items-center gap-2"><Check size={16} className="text-slate-400" />เริ่ม {formatMonthYear(Number(recurring.start_month.slice(0, 4)), Number(recurring.start_month.slice(5, 7)))}</p>
            <p className="flex items-center gap-2">{recurring.status === 'active' ? `ครั้งถัดไป ${formatDate(recurring.next_run_date)}` : 'ไม่มีการสร้างรายการใหม่'}</p>
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            {recurring.status !== 'cancelled' && <button type="button" onClick={() => openEdit(recurring)} disabled={changingId === recurring.id} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50"><Pencil size={15} /> แก้ไข</button>}
            {recurring.status === 'active' && <button type="button" onClick={() => void changeStatus(recurring, 'paused')} disabled={changingId === recurring.id} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-amber-200 px-3 text-sm font-bold text-amber-700 hover:bg-amber-50 disabled:opacity-50"><Pause size={15} /> พักไว้</button>}
            {recurring.status === 'paused' && <button type="button" onClick={() => void changeStatus(recurring, 'active')} disabled={changingId === recurring.id} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-emerald-200 px-3 text-sm font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"><Check size={15} /> เปิดใช้งาน</button>}
            {recurring.status !== 'cancelled' && <button type="button" onClick={() => setCancelTarget(recurring)} disabled={changingId === recurring.id} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-rose-200 px-3 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"><X size={15} /> ยกเลิก</button>}
          </div>
        </article>)}</section>}
      </main>

      {formOpen && <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/45 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => event.target === event.currentTarget && setFormOpen(false)} role="presentation">
        <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-xl sm:rounded-2xl" role="dialog" aria-modal="true" aria-labelledby="recurring-dialog-title">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur"><div><h2 id="recurring-dialog-title" className="text-lg font-extrabold text-slate-900">{editingRecurring ? 'แก้ไขรายการประจำ' : 'เพิ่มรายการประจำ'}</h2><p className="text-xs text-slate-500">ระบบจะสร้างรายการจริงตามกำหนดและรวมในภาพรวมอัตโนมัติ</p></div><button type="button" onClick={() => setFormOpen(false)} className="grid min-h-11 min-w-11 place-items-center rounded-xl text-slate-400 hover:bg-slate-100" aria-label="ปิดหน้าต่าง"><X size={20} /></button></div>
          <div className="p-5"><RecurringTransactionForm key={editingRecurring?.id ?? 'new'} initialRecurring={editingRecurring} categories={categories} categoriesLoading={categoriesLoading} onSubmit={saveRecurring} onCancel={() => setFormOpen(false)} /></div>
        </div>
      </div>}

      <ConfirmDialog open={Boolean(cancelTarget)} title="ยกเลิกรายการประจำนี้หรือไม่?" description={cancelTarget ? `ระบบจะไม่สร้างงวดใหม่ของ “${cancelTarget.name}” แต่รายการที่สร้างไปแล้วจะยังอยู่ในประวัติ` : ''} confirmLabel="ยกเลิกรายการประจำ" loading={Boolean(cancelTarget && changingId === cancelTarget.id)} onClose={() => setCancelTarget(null)} onConfirm={() => cancelTarget ? changeStatus(cancelTarget, 'cancelled') : undefined} />
    </div>
  );
}
