import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TransactionItem } from '../src/components/TransactionItem';
import type { Transaction } from '../src/types';

const transaction: Transaction = {
  id: 'transaction-1',
  user_id: 'user-1',
  type: 'expense',
  amount: 250,
  category: 'อาหาร',
  category_id: 'category-1',
  date: '2026-08-10',
  note: 'มื้อกลางวัน',
  deleted_at: null,
  created_at: '2026-08-10T12:00:00Z',
};

describe('TransactionItem', () => {
  it('shows the transaction and exposes accessible actions', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<TransactionItem transaction={transaction} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByText('อาหาร')).toBeInTheDocument();
    expect(screen.getByText('มื้อกลางวัน')).toBeInTheDocument();
    expect(screen.getByText(/฿250\.00/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'แก้ไขรายการ อาหาร' }));
    fireEvent.click(screen.getByRole('button', { name: 'ลบรายการ อาหาร' }));
    expect(onEdit).toHaveBeenCalledWith(transaction);
    expect(onDelete).toHaveBeenCalledWith(transaction);
  });
});
