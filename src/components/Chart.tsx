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
  month: number;
  refreshToken?: number;
}

export function Chart({ year, month, refreshToken = 0 }: Props) {
  const [data, setData] = useState<MonthlyChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setError('Not authenticated'); return; }

        const { data: rows, error: fetchError } = await supabase
          .from('transactions')
          .select('type, amount, date')
          .eq('user_id', user.id)
          .gte('date', `${year}-01-01`)
          .lte('date', `${year}-12-31`);

        if (fetchError || !rows) { setError(fetchError?.message ?? 'Failed to load chart data'); return; }

        const monthly: MonthlyChartData[] = MONTHS.map((m) => ({
          month: m,
          income: 0,
          expense: 0,
        }));

        for (const row of rows) {
          const monthIndex = parseInt(row.date.slice(5, 7), 10) - 1;
          if (row.type === 'income') monthly[monthIndex].income += Number(row.amount);
          else monthly[monthIndex].expense += Number(row.amount);
        }

        setData(monthly);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [year, month, refreshToken]);

  if (loading) {
    return <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />;
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </p>
      </div>
    );
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
          <Bar
            dataKey="income"
            name="Income"
            shape={(props: any) => {
              const { x, y, width, height, index } = props;
              return <rect x={x} y={y} width={width} height={Math.max(0, height)} rx={4} fill={index === month - 1 ? '#16a34a' : '#86efac'} />;
            }}
          />
          <Bar
            dataKey="expense"
            name="Expense"
            shape={(props: any) => {
              const { x, y, width, height, index } = props;
              return <rect x={x} y={y} width={width} height={Math.max(0, height)} rx={4} fill={index === month - 1 ? '#dc2626' : '#fca5a5'} />;
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
