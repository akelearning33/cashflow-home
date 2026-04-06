import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { supabase } from '../lib/supabaseClient';
import type { MonthlyChartData } from '../types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface Props {
  year: number;
}

export function Chart({ year }: Props) {
  const [data, setData] = useState<MonthlyChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: rows, error } = await supabase
        .from('transactions')
        .select('type, amount, date')
        .gte('date', `${year}-01-01`)
        .lte('date', `${year}-12-31`);

      if (error || !rows) {
        setLoading(false);
        return;
      }

      const monthly: MonthlyChartData[] = MONTHS.map((month) => ({
        month,
        income: 0,
        expense: 0,
      }));

      for (const row of rows) {
        const month = parseInt(row.date.slice(5, 7), 10) - 1;
        if (row.type === 'income') monthly[month].income += Number(row.amount);
        else monthly[month].expense += Number(row.amount);
      }

      setData(monthly);
      setLoading(false);
    }
    load();
  }, [year]);

  if (loading) {
    return <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">
        Monthly Overview — {year}
      </h2>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`}
            width={52}
          />
          <Tooltip
            formatter={(value) => {
              const num = Number(value);
              return `฿${num.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="income" fill="#22c55e" name="Income" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" fill="#ef4444" name="Expense" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
