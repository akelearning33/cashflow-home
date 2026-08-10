export interface Period {
  year: number;
  month: number;
}

export function shiftPeriod(year: number, month: number, offset: number): Period {
  const date = new Date(year, month - 1 + offset, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export function getDefaultDateForPeriod(year: number, month: number, now = new Date()): string {
  const lastDay = new Date(year, month, 0).getDate();
  const day = Math.min(now.getDate(), lastDay);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function getPeriodFromDate(date: string): Period {
  const [year, month] = date.slice(0, 7).split('-').map(Number);
  return { year, month };
}
