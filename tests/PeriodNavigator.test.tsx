import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PeriodNavigator } from '../src/components/PeriodNavigator';

describe('PeriodNavigator', () => {
  it('moves to the previous and next month', () => {
    const onChange = vi.fn();
    render(<PeriodNavigator year={2026} month={1} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'เดือนก่อนหน้า' }));
    expect(onChange).toHaveBeenCalledWith(2025, 12);

    fireEvent.click(screen.getByRole('button', { name: 'เดือนถัดไป' }));
    expect(onChange).toHaveBeenCalledWith(2026, 2);
  });

  it('announces the selected month in Thai using the Gregorian year', () => {
    render(<PeriodNavigator year={2026} month={8} onChange={() => undefined} />);
    expect(screen.getByText(/สิงหาคม 2026/)).toBeInTheDocument();
  });
});
