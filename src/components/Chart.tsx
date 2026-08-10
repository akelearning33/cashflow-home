import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Transaction } from '../types';
import { formatCurrency } from '../utils/formatCurrency';

const MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

interface Props {
  year: number;
  highlightedMonth: number;
  transactions: Transaction[];
}

export function Chart({ year, highlightedMonth, transactions }: Props) {
  const data = useMemo(() => {
    const monthly = MONTHS.map((label) => ({ month: label, income: 0, expense: 0 }));
    for (const transaction of transactions) {
      const monthIndex = Number(transaction.date.slice(5, 7)) - 1;
      if (!monthly[monthIndex]) continue;
      monthly[monthIndex][transaction.type] += Number(transaction.amount);
    }
    return monthly;
  }, [transactions]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" aria-labelledby="year-chart-title">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 id="year-chart-title" className="font-bold text-slate-800">ภาพรวมรายปี</h2>
          <p className="text-xs text-slate-400">เปรียบเทียบรายรับและรายจ่ายรายเดือน</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600">ค.ศ. {year}</span>
      </div>
      <div aria-hidden="true">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(value) => `฿${Math.round(Number(value) / 1000)}k`} width={48} axisLine={false} tickLine={false} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} cursor={{ fill: '#f8fafc' }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="income" name="รายรับ" radius={[4, 4, 0, 0]}>{data.map((_, index) => <Cell key={`income-${index}`} fill={index === highlightedMonth - 1 ? '#059669' : '#a7f3d0'} />)}</Bar>
            <Bar dataKey="expense" name="รายจ่าย" radius={[4, 4, 0, 0]}>{data.map((_, index) => <Cell key={`expense-${index}`} fill={index === highlightedMonth - 1 ? '#e11d48' : '#fecdd3'} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>ตารางรายรับและรายจ่ายแต่ละเดือนของปี {year}</caption>
        <thead><tr><th>เดือน</th><th>รายรับ</th><th>รายจ่าย</th></tr></thead>
        <tbody>{data.map((row) => <tr key={row.month}><th>{row.month}</th><td>{formatCurrency(row.income)}</td><td>{formatCurrency(row.expense)}</td></tr>)}</tbody>
      </table>
    </section>
  );
}
