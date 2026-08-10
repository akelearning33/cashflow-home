import { Pencil, Trash2 } from 'lucide-react';
import type { Transaction } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';

interface Props {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  compact?: boolean;
}

export function TransactionItem({ transaction, onEdit, onDelete, compact = false }: Props) {
  return (
    <article id={`transaction-${transaction.id}`} className="group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-slate-50 focus-within:bg-slate-50">
      <div className={`h-10 w-1.5 flex-shrink-0 rounded-full ${transaction.type === 'income' ? 'bg-emerald-400' : 'bg-rose-400'}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-800">{transaction.category}</p>
        <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-slate-400">
          {!compact && <span className="flex-shrink-0">{formatDate(transaction.date)}</span>}
          {transaction.note && <><span aria-hidden="true">·</span><span className="truncate text-slate-500">{transaction.note}</span></>}
        </div>
      </div>
      <span className={`flex-shrink-0 text-sm font-extrabold ${transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
        {transaction.type === 'income' ? '+' : '−'}{formatCurrency(transaction.amount)}
      </span>
      <div className="flex flex-shrink-0">
        <button type="button" onClick={() => onEdit(transaction)} className="grid min-h-11 min-w-11 place-items-center rounded-xl text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 focus:text-indigo-600" aria-label={`แก้ไขรายการ ${transaction.category}`}>
          <Pencil size={16} />
        </button>
        <button type="button" onClick={() => onDelete(transaction)} className="grid min-h-11 min-w-11 place-items-center rounded-xl text-slate-300 hover:bg-rose-50 hover:text-rose-600 focus:text-rose-600" aria-label={`ลบรายการ ${transaction.category}`}>
          <Trash2 size={17} />
        </button>
      </div>
    </article>
  );
}
