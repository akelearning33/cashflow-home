import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import type { Transaction } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { formatMonthYear } from '../utils/formatDate';

interface Props {
  transactions: Transaction[];
  selectedYear: number;
  selectedMonth: number;
}

export function Dashboard({ transactions, selectedYear, selectedMonth }: Props) {
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netBalance = totalIncome - totalExpense;

  return (
    <div>
      <p className="text-sm text-gray-500 mb-3">
        Summary for {formatMonthYear(selectedYear, selectedMonth)}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Income */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Total Income
            </span>
            <div className="bg-green-100 p-1.5 rounded-lg">
              <TrendingUp size={16} className="text-green-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-green-600">+{formatCurrency(totalIncome)}</p>
        </div>

        {/* Expense */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Total Expense
            </span>
            <div className="bg-red-100 p-1.5 rounded-lg">
              <TrendingDown size={16} className="text-red-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-red-600">-{formatCurrency(totalExpense)}</p>
        </div>

        {/* Net Balance */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Net Balance
            </span>
            <div
              className={`p-1.5 rounded-lg ${
                netBalance >= 0 ? 'bg-indigo-100' : 'bg-orange-100'
              }`}
            >
              <Wallet
                size={16}
                className={netBalance >= 0 ? 'text-indigo-600' : 'text-orange-600'}
              />
            </div>
          </div>
          <p
            className={`text-xl font-bold ${
              netBalance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {netBalance < 0 ? '-' : '+'}{formatCurrency(Math.abs(netBalance))}
          </p>
        </div>
      </div>
    </div>
  );
}
