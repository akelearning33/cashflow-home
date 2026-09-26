import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Save } from 'lucide-react';
import type { Category, RecurringTransaction, RecurringTransactionFormData, TransactionType } from '../types';
import { getThaiErrorMessage } from '../utils/errors';
import { formatDate } from '../utils/formatDate';
import { getRecurringDueCount, getRecurringRunDate } from '../utils/recurring';

interface Props {
  initialRecurring?: RecurringTransaction | null;
  categories: Category[];
  categoriesLoading: boolean;
  onSubmit: (data: RecurringTransactionFormData) => Promise<void>;
  onCancel: () => void;
}

function currentMonthInput() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function RecurringTransactionForm({ initialRecurring, categories, categoriesLoading, onSubmit, onCancel }: Props) {
  const [type, setType] = useState<TransactionType>(initialRecurring?.type ?? 'expense');
  const [name, setName] = useState(initialRecurring?.name ?? '');
  const [amount, setAmount] = useState(initialRecurring ? String(initialRecurring.amount) : '');
  const [categoryId, setCategoryId] = useState(initialRecurring?.category_id ?? '');
  const [dayOfMonth, setDayOfMonth] = useState(initialRecurring ? String(initialRecurring.day_of_month) : '1');
  const [startMonth, setStartMonth] = useState(initialRecurring?.start_month.slice(0, 7) ?? currentMonthInput());
  const [note, setNote] = useState(initialRecurring?.note ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setType(initialRecurring?.type ?? 'expense');
    setName(initialRecurring?.name ?? '');
    setAmount(initialRecurring ? String(initialRecurring.amount) : '');
    setCategoryId(initialRecurring?.category_id ?? '');
    setDayOfMonth(initialRecurring ? String(initialRecurring.day_of_month) : '1');
    setStartMonth(initialRecurring?.start_month.slice(0, 7) ?? currentMonthInput());
    setNote(initialRecurring?.note ?? '');
    setError('');
  }, [initialRecurring]);

  const availableCategories = useMemo(
    () => categories.filter((category) => category.type === type && (category.is_active || category.id === categoryId)),
    [categories, categoryId, type]
  );
  const systemCategories = availableCategories.filter((category) => category.user_id === null);
  const customCategories = availableCategories.filter((category) => category.user_id !== null);
  const previewDay = Number(dayOfMonth);
  const previewDate = startMonth && Number.isInteger(previewDay) && previewDay >= 1 && previewDay <= 31
    ? getRecurringRunDate(`${startMonth}-01`, previewDay)
    : null;
  const catchUpCount = startMonth && Number.isInteger(previewDay) && previewDay >= 1 && previewDay <= 31
    ? getRecurringDueCount(`${startMonth}-01`, previewDay)
    : 0;

  function changeType(nextType: TransactionType) {
    setType(nextType);
    setCategoryId('');
    setError('');
  }

  async function handleSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    setError('');
    const parsedAmount = Number(amount);
    const parsedDay = Number(dayOfMonth);
    const selectedCategory = availableCategories.find((category) => category.id === categoryId);

    if (!name.trim()) {
      setError('กรุณาใส่ชื่อรายการ');
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('จำนวนเงินต้องมากกว่า 0');
      return;
    }
    if (!Number.isInteger(parsedDay) || parsedDay < 1 || parsedDay > 31) {
      setError('วันที่ต้องอยู่ระหว่าง 1 ถึง 31');
      return;
    }
    if (!selectedCategory) {
      setError('กรุณาเลือกหมวดหมู่');
      return;
    }
    if (!startMonth) {
      setError('กรุณาเลือกเดือนเริ่มต้น');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        type,
        amount: String(parsedAmount),
        category_id: selectedCategory.id,
        category: selectedCategory.name,
        day_of_month: String(parsedDay),
        start_month: `${startMonth}-01`,
        note,
      });
    } catch (saveError) {
      setError(getThaiErrorMessage(saveError, initialRecurring ? 'แก้ไขรายการประจำไม่สำเร็จ' : 'เพิ่มรายการประจำไม่สำเร็จ'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1" aria-label="ประเภทรายการประจำ">
        <button type="button" onClick={() => changeType('expense')} className={`min-h-11 rounded-lg text-sm font-bold ${type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`} aria-pressed={type === 'expense'}>รายจ่าย</button>
        <button type="button" onClick={() => changeType('income')} className={`min-h-11 rounded-lg text-sm font-bold ${type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`} aria-pressed={type === 'income'}>รายรับ</button>
      </div>

      <div>
        <label htmlFor="recurring-name" className="mb-1.5 block text-sm font-semibold text-slate-700">ชื่อรายการ</label>
        <input id="recurring-name" autoFocus required value={name} onChange={(event) => setName(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" placeholder="เช่น ค่าเช่าคอนโด" maxLength={120} />
      </div>

      <div>
        <label htmlFor="recurring-amount" className="mb-1.5 block text-sm font-semibold text-slate-700">จำนวนเงินต่อเดือน</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">฿</span>
          <input id="recurring-amount" type="number" inputMode="decimal" min="0.01" step="0.01" required value={amount} onChange={(event) => setAmount(event.target.value)} className="min-h-14 w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-2xl font-extrabold text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" placeholder="0.00" />
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="recurring-category" className="text-sm font-semibold text-slate-700">หมวดหมู่</label>
          <Link to="/categories" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">จัดการหมวดหมู่</Link>
        </div>
        <select id="recurring-category" required value={categoryId} onChange={(event) => setCategoryId(event.target.value)} disabled={categoriesLoading} className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:opacity-60">
          <option value="">{categoriesLoading ? 'กำลังโหลด…' : 'เลือกหมวดหมู่'}</option>
          {systemCategories.length > 0 && <optgroup label="หมวดหมู่มาตรฐาน">{systemCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</optgroup>}
          {customCategories.length > 0 && <optgroup label="หมวดหมู่ของฉัน">{customCategories.map((category) => <option key={category.id} value={category.id}>{category.name}{category.is_active ? '' : ' (เก็บถาวร)'}</option>)}</optgroup>}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="recurring-day" className="mb-1.5 block text-sm font-semibold text-slate-700">วันที่ของทุกเดือน</label>
          <input id="recurring-day" type="number" inputMode="numeric" min="1" max="31" required value={dayOfMonth} onChange={(event) => setDayOfMonth(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" />
          <p className="mt-1 text-xs text-slate-400">ถ้าเดือนไม่มีวันนี้ จะใช้วันสุดท้ายของเดือน</p>
        </div>
        <div>
          <label htmlFor="recurring-start-month" className="mb-1.5 block text-sm font-semibold text-slate-700">เริ่มตั้งแต่เดือน</label>
          <div className="relative">
            <CalendarDays size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input id="recurring-start-month" type="month" required value={startMonth} onChange={(event) => setStartMonth(event.target.value)} disabled={Boolean(initialRecurring)} className="min-h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-500" />
          </div>
          {initialRecurring && <p className="mt-1 text-xs text-slate-400">เดือนเริ่มต้นเดิมไม่เปลี่ยนย้อนหลัง</p>}
        </div>
      </div>

      {previewDate && <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm leading-6 text-indigo-800"><p className="font-bold">ตัวอย่างกำหนดการ</p><p>งวดแรก: {formatDate(previewDate)}{catchUpCount > 0 ? ` · ระบบจะสร้างย้อนหลัง ${catchUpCount} งวดที่ถึงกำหนดแล้ว` : ' · ยังไม่ถึงกำหนด จึงยังไม่สร้างรายการ'}</p></div>}

      <div>
        <label htmlFor="recurring-note" className="mb-1.5 block text-sm font-semibold text-slate-700">หมายเหตุ <span className="font-normal text-slate-400">(ไม่บังคับ)</span></label>
        <input id="recurring-note" type="text" value={note} onChange={(event) => setNote(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" placeholder="เช่น โอนเข้าบัญชีทุกเดือน" maxLength={200} />
      </div>

      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">{error}</p>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} disabled={saving} className="min-h-12 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">ยกเลิก</button>
        <button type="submit" disabled={saving || categoriesLoading} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-bold text-white shadow-lg shadow-indigo-600/15 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
          <Save size={17} /> {saving ? 'กำลังบันทึก…' : initialRecurring ? 'บันทึกการแก้ไข' : 'เพิ่มรายการประจำ'}
        </button>
      </div>
    </form>
  );
}
