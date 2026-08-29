import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMonthYear } from '../utils/formatDate';
import { shiftPeriod } from '../utils/period';

const MONTH_OPTIONS = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

interface Props {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}

export function PeriodNavigator({ year, month, onChange }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(year);
  const containerRef = useRef<HTMLDivElement>(null);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const isCurrentMonth = year === currentYear && month === currentMonth;

  useEffect(() => {
    if (!pickerOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current?.contains(event.target as Node)) return;
      setPickerOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setPickerOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [pickerOpen]);

  function move(offset: number) {
    const next = shiftPeriod(year, month, offset);
    setPickerOpen(false);
    onChange(next.year, next.month);
  }

  function togglePicker() {
    setPickerOpen((open) => {
      if (!open) setPickerYear(year);
      return !open;
    });
  }

  function chooseMonth(nextMonth: number) {
    onChange(pickerYear, nextMonth);
    setPickerOpen(false);
  }

  function goToCurrentMonth() {
    onChange(currentYear, currentMonth);
    setPickerYear(currentYear);
    setPickerOpen(false);
  }

  return (
    <div ref={containerRef} className="relative flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm" aria-label="เลือกเดือน">
      {!isCurrentMonth && (
        <button type="button" onClick={goToCurrentMonth} className="min-h-11 rounded-lg px-3 text-xs font-bold text-indigo-600 hover:bg-indigo-50">เดือนนี้</button>
      )}
      <button type="button" onClick={() => move(-1)} className="grid min-h-11 min-w-11 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label="เดือนก่อนหน้า">
        <ChevronLeft size={19} />
      </button>
      <button type="button" onClick={togglePicker} className="flex min-h-11 min-w-40 items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold text-slate-800 hover:bg-slate-100" aria-expanded={pickerOpen} aria-haspopup="dialog">
        <CalendarDays size={17} className="text-slate-400" />
        <span aria-live="polite">{formatMonthYear(year, month)}</span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${pickerOpen ? 'rotate-180' : ''}`} />
      </button>
      <button type="button" onClick={() => move(1)} className="grid min-h-11 min-w-11 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label="เดือนถัดไป">
        <ChevronRight size={19} />
      </button>
      

      {pickerOpen && (
        <div className="absolute left-0 top-full z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10" role="dialog" aria-label="เลือกเดือนและปี">
          <div className="mb-3 flex items-center justify-between gap-2">
            <button type="button" onClick={() => setPickerYear((value) => value - 1)} className="grid min-h-10 min-w-10 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label="ปีก่อนหน้า">
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2 text-sm font-black text-slate-800">
              <CalendarDays size={16} className="text-indigo-500" />
              ค.ศ. {pickerYear}
            </div>
            <button type="button" onClick={() => setPickerYear((value) => value + 1)} className="grid min-h-10 min-w-10 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label="ปีถัดไป">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {MONTH_OPTIONS.map((label, index) => {
              const optionMonth = index + 1;
              const isSelected = pickerYear === year && optionMonth === month;
              const isCurrentOption = pickerYear === currentYear && optionMonth === currentMonth;

              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => chooseMonth(optionMonth)}
                  className={`min-h-11 rounded-xl text-sm font-bold transition-colors ${isSelected ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20' : isCurrentOption ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                  aria-pressed={isSelected}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
