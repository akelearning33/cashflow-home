import { Trash2 } from 'lucide-react';
import type { Transaction } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';

interface Props {
  transaction: Transaction;
  onDelete: (id: string) => void;
}

export function TransactionItem({ transaction, onDelete }: Props) {
  function handleDelete() {
    if (window.confirm(`Delete this ${transaction.type} of ${formatCurrency(transaction.amount)}?`)) {
      onDelete(transaction.id);
    }
  }

  return (
    <div className="flex items-center gap-3 py-3 px-4 hover:bg-gray-50 transition-colors rounded-lg">
      {/* Type indicator */}
      <div
        className={`w-2 h-8 rounded-full flex-shrink-0 ${
          transaction.type === 'income' ? 'bg-green-400' : 'bg-red-400'
        }`}
      />

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-800">{transaction.category}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-400">{formatDate(transaction.date)}</span>
          {transaction.note && (
            <span className="text-xs text-gray-500 truncate max-w-[200px]">
              · {transaction.note}
            </span>
          )}
        </div>
      </div>

      {/* Amount */}
      <span
        className={`text-sm font-semibold flex-shrink-0 ${
          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
        }`}
      >
        {transaction.type === 'income' ? '+' : '-'}
        {formatCurrency(transaction.amount)}
      </span>

      {/* Delete */}
      <button
        onClick={handleDelete}
        className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 p-1"
        title="Delete transaction"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
