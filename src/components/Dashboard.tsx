import { ArrowDownRight, ArrowUpRight, ReceiptText, Wallet } from 'lucide-react';
import type { Transaction } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { getCategoryColor } from '../utils/categoryColors';
import { TransactionItem } from './TransactionItem';

interface Props {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onAdd: () => void;
}

export function Dashboard({ transactions, onEdit, onDelete, onAdd }: Props) {
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
      <section className="grid gap-4 md:grid-cols-4" aria-label="สรุปยอดประจำเดือน">
        <article className="flex min-h-44 flex-col justify-between rounded-3xl bg-slate-900 p-6 text-white shadow-xl shadow-slate-900/15 md:col-span-2">
          <div className="flex items-start justify-between">
            <div><p className="text-xs font-bold uppercase tracking-widest text-slate-400">ยอดสุทธิเดือนนี้</p><p className="mt-1 text-sm text-slate-400">รายรับหักรายจ่ายที่บันทึกไว้</p></div>
            <span className="rounded-xl bg-white/10 p-2.5"><Wallet size={20} /></span>
          </div>
          <p className={`mt-8 text-4xl font-black tracking-tight sm:text-5xl ${net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{net >= 0 ? '+' : '−'}{formatCurrency(Math.abs(net))}</p>
        </article>
        <article className="flex min-h-44 flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-widest text-slate-500">รายรับ</p><span className="rounded-xl bg-emerald-50 p-2 text-emerald-600"><ArrowUpRight size={18} /></span></div>
          <p className="text-2xl font-black text-emerald-600">+{formatCurrency(income)}</p>
        </article>
        <article className="flex min-h-44 flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-widest text-slate-500">รายจ่าย</p><span className="rounded-xl bg-rose-50 p-2 text-rose-600"><ArrowDownRight size={18} /></span></div>
          <p className="text-2xl font-black text-rose-600">−{formatCurrency(expense)}</p>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold text-slate-800">หมวดรายจ่ายสูงสุด</h2><p className="text-xs text-slate-400">เรียงจากยอดใช้จ่ายมากที่สุด</p></div></div>
          {topCategories.length === 0 ? <div className="py-10 text-center text-sm text-slate-400">ยังไม่มีรายจ่ายในเดือนนี้</div> : <div className="space-y-4">{topCategories.map((category, index) => { const percentage = expense ? Math.round((category.amount / expense) * 100) : 0; return <div key={category.name}><div className="mb-1.5 flex items-center justify-between gap-3"><span className="truncate text-sm font-bold text-slate-700">{category.name}</span><span className="text-sm font-extrabold text-rose-600">{formatCurrency(category.amount)}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: getCategoryColor(category.name, index) }} /></div><p className="mt-1 text-right text-[11px] text-slate-400">{percentage}% ของรายจ่าย</p></div>; })}</div>}
        </article>

        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-bold text-slate-800">รายการล่าสุด</h2><p className="text-xs text-slate-400">5 รายการล่าสุดในเดือนนี้</p></div><ReceiptText size={19} className="text-slate-400" /></div>
          {recent.length === 0 ? <div className="px-6 py-10 text-center"><p className="text-sm text-slate-400">ยังไม่มีรายการ</p><button type="button" onClick={onAdd} className="mt-3 min-h-11 rounded-xl bg-indigo-50 px-4 text-sm font-bold text-indigo-700">เพิ่มรายการแรก</button></div> : <div className="divide-y divide-slate-50 p-1">{recent.map((transaction) => <TransactionItem key={transaction.id} transaction={transaction} onEdit={onEdit} onDelete={onDelete} compact />)}</div>}
        </article>
      </section>
    </div>
  );
}
