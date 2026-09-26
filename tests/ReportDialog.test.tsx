import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ReportDialog } from '../src/components/ReportDialog';
import type { Transaction } from '../src/types';

const transaction: Transaction = {
  id: 'transaction-report-1',
  user_id: 'user-1',
  type: 'income',
  amount: 12000,
  category: 'เงินเดือน',
  category_id: 'salary',
  date: '2026-08-01',
  note: 'เงินเดือนสิงหาคม',
  deleted_at: null,
  created_at: '2026-08-01T09:00:00Z',
};

describe('ReportDialog', () => {
  it('renders the Thai monthly tracker layout and starts printing', () => {
    const onClose = vi.fn();
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    render(<ReportDialog open year={2026} month={8} transactions={[transaction]} onClose={onClose} />);

    expect(screen.getByRole('heading', { name: 'รายงานรายรับและรายจ่าย' })).toBeInTheDocument();
    expect(screen.getByText('สรุปการเงินประจำเดือน')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'รายละเอียดรายการ' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'รายรับ' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'รายจ่าย' })).toBeInTheDocument();
    expect(screen.getByText('สิงหาคม', { exact: true })).toBeInTheDocument();
    expect(screen.queryByText('สิงหาคม 2026', { exact: true })).not.toBeInTheDocument();
    expect(screen.getByText('เงินเดือนสิงหาคม')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'พิมพ์ / บันทึก PDF' }));
    expect(print).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledTimes(1);
    print.mockRestore();
    open.mockRestore();
  });
});
