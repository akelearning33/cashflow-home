import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from '../src/components/ConfirmDialog';

describe('ConfirmDialog', () => {
  it('confirms and closes with accessible controls', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(<ConfirmDialog open title="ลบรายการนี้หรือไม่?" description="รายการจะถูกซ่อน" confirmLabel="ลบรายการ" onConfirm={onConfirm} onClose={onClose} />);

    expect(screen.getByRole('alertdialog')).toHaveAccessibleName('ลบรายการนี้หรือไม่?');
    fireEvent.click(screen.getByRole('button', { name: 'ลบรายการ' }));
    expect(onConfirm).toHaveBeenCalledOnce();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
