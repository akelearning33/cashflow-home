import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import type { Transaction } from '../types';
import { supabase } from '../lib/supabaseClient';
import { formatCurrency } from '../utils/formatCurrency';
import { formatMonthYear } from '../utils/formatDate';

interface Props {
  transactions: Transaction[];
  selectedYear: number;
  selectedMonth: number;
}

export function Dashboard({ transactions, selectedYear, selectedMonth }: Props) {
  const [yearlyIncome, setYearlyIncome] = useState(0);
  const [yearlyExpense, setYearlyExpense] = useState(0);

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netBalance = totalIncome - totalExpense;
  const yearlyNetBalance = yearlyIncome - yearlyExpense;

  useEffect(() => {
    let isMounted = true;

    async function loadYearlyTotals() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted) {
        setYearlyIncome(0);
        setYearlyExpense(0);
        return;
      }

      const { data: rows, error } = await supabase
        .from('transactions')
        .select('type, amount, date')
        .eq('user_id', user.id)
        .gte('date', `${selectedYear}-01-01`)
        .lte('date', `${selectedYear}-12-31`);

      if (error || !rows || !isMounted) {
        setYearlyIncome(0);
        setYearlyExpense(0);
        return;
      }

      const income = rows
        .filter((row) => row.type === 'income')
        .reduce((sum, row) => sum + Number(row.amount), 0);

      const expense = rows
        .filter((row) => row.type === 'expense')
        .reduce((sum, row) => sum + Number(row.amount), 0);

      setYearlyIncome(income);
      setYearlyExpense(expense);
    }

    void loadYearlyTotals();

    return () => {
      isMounted = false;
    };
  }, [selectedYear, transactions]);

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

      <div className="mt-6">
        <p className="text-sm text-gray-500 mb-3">
          Yearly summary for {selectedYear}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Total Income
              </span>
              <div className="bg-green-100 p-1.5 rounded-lg">
                <TrendingUp size={16} className="text-green-600" />
              </div>
            </div>
            <p className="text-xl font-bold text-green-600">+{formatCurrency(yearlyIncome)}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Total Expense
              </span>
              <div className="bg-red-100 p-1.5 rounded-lg">
                <TrendingDown size={16} className="text-red-600" />
              </div>
            </div>
            <p className="text-xl font-bold text-red-600">-{formatCurrency(yearlyExpense)}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Total Net Balance
              </span>
              <div
                className={`p-1.5 rounded-lg ${
                  yearlyNetBalance >= 0 ? 'bg-indigo-100' : 'bg-orange-100'
                }`}
              >
                <Wallet
                  size={16}
                  className={yearlyNetBalance >= 0 ? 'text-indigo-600' : 'text-orange-600'}
                />
              </div>
            </div>
            <p
              className={`text-xl font-bold ${
                yearlyNetBalance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {yearlyNetBalance < 0 ? '-' : '+'}{formatCurrency(Math.abs(yearlyNetBalance))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
