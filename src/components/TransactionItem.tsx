import { Pencil, Repeat, Trash2 } from 'lucide-react';
import type { Transaction } from '../types';
import { CurrencyAmount } from './CurrencyAmount';
import { formatDate } from '../utils/formatDate';

interface Props {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  compact?: boolean;
}

export function TransactionItem({ transaction, onEdit, onDelete, compact = false }: Props) {
  const isRecurring = Boolean(transaction.recurring_transaction_id || transaction.recurring_name);
  const displayName = transaction.recurring_name ?? transaction.category;

  return (
    <article id={`transaction-${transaction.id}`} className="group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-slate-50 focus-within:bg-slate-50">
      <div className={`h-10 w-1.5 flex-shrink-0 rounded-full ${transaction.type === 'income' ? 'bg-emerald-400' : 'bg-rose-400'}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-800">{displayName}</p>
        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-600">
          <span className="flex-shrink-0">{formatDate(transaction.date)}</span>
          {isRecurring && <><span aria-hidden="true">·</span><span className="flex flex-shrink-0 items-center gap-1 text-indigo-700" title="รายการประจำ"><Repeat size={12} /> ประจำ</span></>}
          {isRecurring && transaction.recurring_name && <><span aria-hidden="true">·</span><span className="truncate">{transaction.category}</span></>}
          {transaction.note && <><span aria-hidden="true">·</span><span className="max-w-full truncate text-slate-700">{transaction.note}</span></>}
        </div>
      </div>
      <CurrencyAmount amount={transaction.amount} sign={transaction.type === 'income' ? 'positive' : 'negative'} className={`flex-shrink-0 text-sm font-semibold ${transaction.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`} />
      <div className={`flex flex-shrink-0 ${compact ? 'hidden sm:flex' : ''}`}>
        <button type="button" onClick={() => onEdit(transaction)} className="grid min-h-10 min-w-10 place-items-center rounded-lg text-slate-600 hover:bg-indigo-50 hover:text-indigo-800 focus:text-indigo-800" aria-label={`แก้ไขรายการ ${displayName}`}>
          <Pencil size={16} />
        </button>
        <button type="button" onClick={() => onDelete(transaction)} className="grid min-h-10 min-w-10 place-items-center rounded-lg text-slate-600 hover:bg-rose-50 hover:text-rose-700 focus:text-rose-700" aria-label={`ลบรายการ ${displayName}`}>
          <Trash2 size={17} />
        </button>
      </div>
      {compact && <div className="flex flex-shrink-0 sm:hidden">
        <button type="button" onClick={() => onEdit(transaction)} className="grid min-h-10 min-w-10 place-items-center rounded-lg text-slate-600 hover:bg-indigo-50 hover:text-indigo-800" aria-label={`แก้ไขรายการ ${displayName}`}><Pencil size={15} /></button>
        <button type="button" onClick={() => onDelete(transaction)} className="grid min-h-10 min-w-10 place-items-center rounded-lg text-slate-600 hover:bg-rose-50 hover:text-rose-700" aria-label={`ลบรายการ ${displayName}`}><Trash2 size={16} /></button>
      </div>}
    </article>
  );
}
