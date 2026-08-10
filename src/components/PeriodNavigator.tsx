import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMonthYear } from '../utils/formatDate';
import { shiftPeriod } from '../utils/period';

interface Props {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}

export function PeriodNavigator({ year, month, onChange }: Props) {
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  function move(offset: number) {
    const next = shiftPeriod(year, month, offset);
    onChange(next.year, next.month);
  }

  return (
    <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm" aria-label="เลือกเดือน">
      <button type="button" onClick={() => move(-1)} className="grid min-h-11 min-w-11 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label="เดือนก่อนหน้า">
        <ChevronLeft size={19} />
      </button>
      <span className="min-w-32 px-2 text-center text-sm font-bold text-slate-800" aria-live="polite">{formatMonthYear(year, month)}</span>
      <button type="button" onClick={() => move(1)} className="grid min-h-11 min-w-11 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label="เดือนถัดไป">
        <ChevronRight size={19} />
      </button>
      {!isCurrentMonth && (
        <button type="button" onClick={() => onChange(now.getFullYear(), now.getMonth() + 1)} className="min-h-11 rounded-lg px-3 text-xs font-bold text-indigo-600 hover:bg-indigo-50">เดือนนี้</button>
      )}
    </div>
  );
}
