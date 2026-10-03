import { useState } from 'react';
import type { Transaction } from '../types';
import { TransactionForm } from './TransactionForm';
import { AppDialog } from './AppDialog';

interface Props {
  open: boolean;
  year: number;
  month: number;
  transaction?: Transaction | null;
  onClose: () => void;
  onSaved: (transaction: Transaction) => void;
}

export function TransactionDialog({ open, year, month, transaction, onClose, onSaved }: Props) {
  const [formDirty, setFormDirty] = useState(false);
  const [formSaving, setFormSaving] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  function closeDialog() {
    if (formSaving) return;
    setFormDirty(false);
    setDiscardOpen(false);
    setFormSaving(false);
    onClose();
  }

  function requestClose() {
    if (formSaving) return;
    if (formDirty) setDiscardOpen(true);
    else closeDialog();
  }

  function discardChanges() {
    closeDialog();
  }

  return (
    <>
    <AppDialog open={open} titleId="transaction-dialog-title" title={transaction ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'} description="ข้อมูลการเงินจะแสดงเฉพาะในบัญชีของคุณ" onClose={requestClose}>
      {open && <div className="p-4 sm:p-5">
          <TransactionForm key={transaction?.id ?? `${year}-${month}`} defaultYear={year} defaultMonth={month} initialTransaction={transaction} onSuccess={async (saved) => { setFormDirty(false); setDiscardOpen(false); await onSaved(saved); }} onCancel={requestClose} onDirtyChange={setFormDirty} onBusyChange={setFormSaving} />
      </div>}
    </AppDialog>
    <AppDialog open={discardOpen} titleId="discard-transaction-title" title="ทิ้งการเปลี่ยนแปลงหรือไม่?" description="ข้อมูลที่ยังไม่ได้บันทึกจะหายไป" role="alertdialog" onClose={() => setDiscardOpen(false)}>
      <div className="flex gap-2 p-4 sm:p-5"><button type="button" onClick={() => setDiscardOpen(false)} className="min-h-12 flex-1 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700">ทำต่อ</button><button type="button" onClick={discardChanges} className="min-h-12 flex-1 rounded-xl bg-rose-700 text-sm font-semibold text-white hover:bg-rose-800">ทิ้งรายการ</button></div>
    </AppDialog>
    </>
  );
}
