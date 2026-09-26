import { describe, expect, it } from 'vitest';
import { getNextRecurringDate, getRecurringDueCount, getRecurringRunDate, toMonthStart } from '../src/utils/recurring';

describe('recurring date utilities', () => {
  it('clamps dates to the last day of short months', () => {
    expect(getRecurringRunDate('2026-02-01', 31)).toBe('2026-02-28');
    expect(getRecurringRunDate('2028-02-01', 31)).toBe('2028-02-29');
    expect(getRecurringRunDate('2026-04-01', 31)).toBe('2026-04-30');
  });

  it('keeps a month input at the first day', () => {
    expect(toMonthStart('2026-08-23')).toBe('2026-08-01');
  });

  it('moves to the next month after the current due date has passed', () => {
    expect(getNextRecurringDate(3, new Date(2026, 7, 10))).toBe('2026-09-03');
    expect(getNextRecurringDate(31, new Date(2026, 1, 20))).toBe('2026-02-28');
    expect(getNextRecurringDate(31, new Date(2026, 1, 28))).toBe('2026-02-28');
  });

  it('counts due months for the first-run preview', () => {
    expect(getRecurringDueCount('2026-07-01', 3, new Date(2026, 8, 21))).toBe(3);
    expect(getRecurringDueCount('2026-10-01', 3, new Date(2026, 8, 21))).toBe(0);
  });
});
