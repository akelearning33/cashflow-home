import { getDaysInMonth } from 'date-fns';

function parseDateInput(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function toMonthStart(value: string): string {
  const date = parseDateInput(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

export function getRecurringRunDate(month: string, dayOfMonth: number): string {
  const monthStart = parseDateInput(toMonthStart(month));
  const day = Math.min(Math.max(Math.trunc(dayOfMonth), 1), getDaysInMonth(monthStart));
  return `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function getTodayInput(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function getNextRecurringDate(dayOfMonth: number, now = new Date()): string {
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const currentDate = getRecurringRunDate(currentMonth, dayOfMonth);
  if (currentDate >= getTodayInput(now)) return currentDate;

  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return getRecurringRunDate(`${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`, dayOfMonth);
}

export function getRecurringDueCount(month: string, dayOfMonth: number, now = new Date()): number {
  const start = parseDateInput(toMonthStart(month));
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  let cursor = start;
  let count = 0;

  for (let index = 0; index < 240 && cursor <= currentMonth; index += 1) {
    if (getRecurringRunDate(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-01`, dayOfMonth) <= getTodayInput(now)) {
      count += 1;
    }
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  return count;
}

export function getMonthInputFromDate(date: string): string {
  return toMonthStart(date);
}
