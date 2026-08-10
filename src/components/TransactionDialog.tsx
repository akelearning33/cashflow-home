import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { Transaction } from '../types';
import { TransactionForm } from './TransactionForm';

interface Props {
  open: boolean;
  year: number;
  month: number;
  transaction?: Transaction | null;
  onClose: () => void;
  onSaved: (transaction: Transaction) => void;
}

export function TransactionDialog({ open, year, month, transaction, onClose, onSaved }: Props) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/45 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()} role="presentation">
      <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-xl sm:rounded-2xl" role="dialog" aria-modal="true" aria-labelledby="transaction-dialog-title">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur">
          <div>
            <h2 id="transaction-dialog-title" className="text-lg font-extrabold text-slate-900">{transaction ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}</h2>
            <p className="text-xs text-slate-500">ข้อมูลของคุณจะมองเห็นได้เฉพาะบัญชีนี้</p>
          </div>
          <button type="button" onClick={onClose} className="grid min-h-11 min-w-11 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-800" aria-label="ปิดหน้าต่าง">
            <X size={20} />
          </button>
        </div>
        <div className="p-5">
          <TransactionForm key={transaction?.id ?? `${year}-${month}`} defaultYear={year} defaultMonth={month} initialTransaction={transaction} onSuccess={onSaved} onCancel={onClose} />
        </div>
      </div>
    </div>
  );
}
