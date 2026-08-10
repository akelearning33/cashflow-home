import { describe, expect, it } from 'vitest';
import { getDefaultDateForPeriod, getPeriodFromDate, shiftPeriod } from '../src/utils/period';

describe('period utilities', () => {
  it('moves across year boundaries', () => {
    expect(shiftPeriod(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftPeriod(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
  });

  it('keeps the current day inside the selected month', () => {
    expect(getDefaultDateForPeriod(2026, 2, new Date(2026, 0, 31))).toBe('2026-02-28');
    expect(getDefaultDateForPeriod(2028, 2, new Date(2028, 0, 31))).toBe('2028-02-29');
    expect(getDefaultDateForPeriod(2026, 7, new Date(2026, 7, 10))).toBe('2026-07-10');
  });

  it('extracts the visible period from a transaction date', () => {
    expect(getPeriodFromDate('2026-08-10')).toEqual({ year: 2026, month: 8 });
  });
});
