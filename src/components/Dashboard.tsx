import { ArrowDownRight, ArrowUpRight, ReceiptText } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import type { Transaction } from '../types';
import { CurrencyAmount } from './CurrencyAmount';
import { getCategoryColor } from '../utils/categoryColors';
import { formatMonthYear } from '../utils/formatDate';
import { periodSearch } from '../hooks/useSelectedPeriod';
import { TransactionItem } from './TransactionItem';

interface Props {
  transactions: Transaction[];
  year: number;
  month: number;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onAdd: () => void;
}

export function Dashboard({ transactions, year, month, onEdit, onDelete, onAdd }: Props) {
  const income = transactions.filter((transaction) => transaction.type === 'income').reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const expense = transactions.filter((transaction) => transaction.type === 'expense').reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const net = income - expense;
  const recent = transactions.slice(0, 5);

  const categoryMap = new Map<string, number>();
  for (const transaction of transactions.filter((item) => item.type === 'expense')) {
    categoryMap.set(transaction.category, (categoryMap.get(transaction.category) ?? 0) + Number(transaction.amount));
  }
  const topCategories = Array.from(categoryMap, ([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount).slice(0, 4);

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4" aria-label={`สรุปยอด ${formatMonthYear(year, month)}`}>
        <article className="col-span-2 flex min-h-32 flex-col justify-between rounded-2xl bg-slate-900 p-4 text-white sm:min-h-36 sm:p-5 md:col-span-2 md:min-h-44 md:rounded-3xl md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-sm font-semibold text-slate-100">ยอดสุทธิ</p><p className="mt-1 text-xs text-slate-300">{formatMonthYear(year, month)} · รายรับหักรายจ่าย</p></div>
            <span className="rounded-xl bg-white/10 p-2.5 text-white"><ReceiptText size={18} /></span>
          </div>
          <CurrencyAmount amount={net} sign={net >= 0 ? 'positive' : 'negative'} className={`mt-4 block text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl ${net >= 0 ? 'text-emerald-300' : 'text-rose-300'}`} />
        </article>
        <article className="flex min-h-24 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3 sm:min-h-28 sm:p-4 md:min-h-36 md:rounded-2xl md:p-5">
          <div className="flex items-center justify-between gap-1"><p className="text-sm font-semibold text-slate-700">รายรับ</p><span className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700"><ArrowUpRight size={16} /></span></div>
          <CurrencyAmount amount={income} sign="positive" className="mt-3 block text-base font-semibold text-emerald-700 sm:text-lg md:text-xl" />
        </article>
        <article className="flex min-h-24 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3 sm:min-h-28 sm:p-4 md:min-h-36 md:rounded-2xl md:p-5">
          <div className="flex items-center justify-between gap-1"><p className="text-sm font-semibold text-slate-700">รายจ่าย</p><span className="rounded-lg bg-rose-50 p-1.5 text-rose-700"><ArrowDownRight size={16} /></span></div>
          <CurrencyAmount amount={expense} sign="negative" className="mt-3 block text-base font-semibold text-rose-700 sm:text-lg md:text-xl" />
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="mb-4"><h2 className="font-semibold text-slate-900">หมวดรายจ่ายสูงสุด</h2><p className="mt-0.5 text-xs text-slate-600">{formatMonthYear(year, month)}</p></div>
          {topCategories.length === 0 ? <div className="py-8 text-center text-sm text-slate-600">เดือนนี้ยังไม่มีรายจ่าย</div> : <div className="space-y-4">{topCategories.map((category, index) => { const percentage = expense ? Math.round((category.amount / expense) * 100) : 0; return <div key={category.name}><div className="mb-1.5 flex items-center justify-between gap-3"><span className="truncate text-sm font-medium text-slate-800">{category.name}</span><CurrencyAmount amount={category.amount} className="text-sm font-semibold text-slate-800" /></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: getCategoryColor(category.name, index) }} /></div><p className="mt-1 text-right text-xs text-slate-600">{percentage}% ของรายจ่าย</p></div>; })}</div>}
        </article>

        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 sm:px-5"><div><h2 className="font-semibold text-slate-900">รายการล่าสุด</h2><p className="text-xs text-slate-600">5 รายการ · {formatMonthYear(year, month)}</p></div><NavLink to={{ pathname: '/transactions', search: periodSearch(year, month) }} className="min-h-11 inline-flex items-center rounded-lg px-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">ดูทั้งหมด</NavLink></div>
          {recent.length === 0 ? <div className="px-5 py-8 text-center"><p className="text-sm text-slate-600">เดือนนี้ยังไม่มีรายการ</p><button type="button" onClick={onAdd} className="mt-3 min-h-11 rounded-xl bg-indigo-50 px-4 text-sm font-semibold text-indigo-800 hover:bg-indigo-100">เพิ่มรายการแรก</button></div> : <div className="divide-y divide-slate-100 px-1">{recent.map((transaction) => <TransactionItem key={transaction.id} transaction={transaction} onEdit={onEdit} onDelete={onDelete} compact />)}</div>}
        </article>
      </section>
    </div>
  );
}
