import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Period } from '../utils/period';

export function readSelectedPeriod(params: URLSearchParams, now = new Date()): Period {
  const year = Number(params.get('year'));
  const month = Number(params.get('month'));
  return Number.isInteger(year) && year >= 1900 && year <= 2100 && Number.isInteger(month) && month >= 1 && month <= 12
    ? { year, month }
    : { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function periodSearch(year: number, month: number, add = false) {
  const params = new URLSearchParams({ year: String(year), month: String(month) });
  if (add) params.set('add', '1');
  return `?${params.toString()}`;
}

export function useSelectedPeriod() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selected = readSelectedPeriod(searchParams);
  const setPeriod = useCallback((year: number, month: number) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('year', String(year));
      next.set('month', String(month));
      return next;
    });
  }, [setSearchParams]);

  return { ...selected, setPeriod };
}
