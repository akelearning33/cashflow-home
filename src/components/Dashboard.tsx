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
    <div className="space-y-8">
      {/* Monthly Section */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">
            Monthly Summary
          </h2>
          <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {formatMonthYear(selectedYear, selectedMonth)}
          </span>
        </div>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* Net Balance Card - High Contrast */}
          <div
            className="rounded-2xl p-6 md:col-span-2 bg-slate-900 shadow-lg shadow-slate-900/20 flex flex-col justify-between"
            style={{ animation: 'fadeSlideUp 400ms cubic-bezier(0.16, 1, 0.3, 1) 0ms both' }}
          >
            <div className="mb-8 flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Net Balance
                </span>
                <p className="text-sm text-slate-500 mt-1">Available funds this month</p>
              </div>
              <div className="rounded-xl bg-white/10 p-2.5 text-white backdrop-blur-sm">
                <Wallet size={20} strokeWidth={2.5} />
              </div>
            </div>
            <p
              className={`text-4xl sm:text-5xl font-black tracking-tight ${
                netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {netBalance < 0 ? '-' : '+'}
              {formatCurrency(Math.abs(netBalance))}
            </p>
          </div>

          {/* Total Income Card */}
          <div 
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            style={{ animation: 'premiumSlideUp 400ms cubic-bezier(0.16, 1, 0.3, 1) 100ms both' }}
          >
            <div className="mb-8 flex items-start justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Total Income
              </span>
              <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                <TrendingUp size={18} strokeWidth={2.5} />
              </div>
            </div>
            <p className="text-2xl font-extrabold tracking-tight text-emerald-600">
              +{formatCurrency(totalIncome)}
            </p>
          </div>

          {/* Total Expense Card */}
          <div 
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            style={{ animation: 'premiumSlideUp 400ms cubic-bezier(0.16, 1, 0.3, 1) 150ms both' }}
          >
            <div className="mb-8 flex items-start justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Total Expense
              </span>
              <div className="rounded-xl bg-rose-50 p-2 text-rose-600">
                <TrendingDown size={18} strokeWidth={2.5} />
              </div>
            </div>
            <p className="text-2xl font-extrabold tracking-tight text-rose-600">
              -{formatCurrency(totalExpense)}
            </p>
          </div>
        </div>
      </section>

      {/* Yearly Section */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">
            Yearly Overview
          </h2>
          <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {selectedYear}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div
            className="rounded-2xl p-6 md:col-span-2 bg-slate-900 shadow-lg shadow-slate-900/20 flex flex-col justify-between"
            style={{ animation: 'fadeSlideUp 400ms cubic-bezier(0.16, 1, 0.3, 1) 225ms both' }}
          >
            <div className="mb-8 flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Net Balance
                </span>
                <p className="text-sm text-slate-500 mt-1">Accumulated for {selectedYear}</p>
              </div>
              <div className="rounded-xl bg-white/10 p-2.5 text-white backdrop-blur-sm">
                <Wallet size={20} strokeWidth={2.5} />
              </div>
            </div>
            <p
              className={`text-4xl sm:text-5xl font-black tracking-tight ${
                yearlyNetBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {yearlyNetBalance < 0 ? '-' : '+'}
              {formatCurrency(Math.abs(yearlyNetBalance))}
            </p>
          </div>

          {/* Yearly Income Card */}
          <div 
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            style={{ animation: 'premiumSlideUp 400ms cubic-bezier(0.16, 1, 0.3, 1) 250ms both' }}
          >
            <div className="mb-8 flex items-start justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Total Income
              </span>
              <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                <TrendingUp size={18} strokeWidth={2.5} />
              </div>
            </div>
            <p className="text-2xl font-extrabold tracking-tight text-emerald-600">
              +{formatCurrency(yearlyIncome)}
            </p>
          </div>

          {/* Yearly Expense Card */}
          <div 
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            style={{ animation: 'premiumSlideUp 400ms cubic-bezier(0.16, 1, 0.3, 1) 300ms both' }}
          >
            <div className="mb-8 flex items-start justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Total Expense
              </span>
              <div className="rounded-xl bg-rose-50 p-2 text-rose-600">
                <TrendingDown size={18} strokeWidth={2.5} />
              </div>
            </div>
            <p className="text-2xl font-extrabold tracking-tight text-rose-600">
              -{formatCurrency(yearlyExpense)}
            </p>
          </div>
        </div>
      </section>
      
      <style>
        {`
          @keyframes fadeSlideUp {
            from {
              opacity: 0;
              transform: translateY(16px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
}