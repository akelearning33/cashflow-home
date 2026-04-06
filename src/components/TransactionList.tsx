import type { Transaction } from '../types';
import { TransactionItem } from './TransactionItem';

interface Props {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  loading: boolean;
}

export function TransactionList({ transactions, onDelete, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-sm">No transactions found for this period.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {transactions.map((t) => (
        <TransactionItem key={t.id} transaction={t} onDelete={onDelete} />
      ))}
    </div>
  );
}
