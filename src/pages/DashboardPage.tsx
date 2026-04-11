import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Dashboard } from '../components/Dashboard';
import { Chart } from '../components/Chart';
import { TransactionForm } from '../components/TransactionForm';
import { useTransactions } from '../hooks/useTransactions';

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
const MONTHS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' },
  { value: 3, label: 'March' }, { value: 4, label: 'April' },
  { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' },
  { value: 9, label: 'September' }, { value: 10, label: 'October' },
  { value: 11, label: 'November' }, { value: 12, label: 'December' },
];

export function DashboardPage() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [showForm, setShowForm] = useState(false);
  const [chartRefreshToken, setChartRefreshToken] = useState(0);
  const { transactions, loading, error, fetchTransactions } = useTransactions();

  useEffect(() => {
    fetchTransactions(year, month);
  }, [year, month, fetchTransactions]);

  function handleTransactionAdded() {
    setShowForm(false);
    fetchTransactions(year, month);
    setChartRefreshToken((v) => v + 1);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* Header row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center gap-2">
            {/* Month selector */}
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            {/* Year selector */}
            <select
              value={year}
              onChange={
                (e) => setYear(Number(e.target.value))
              }
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            {/* Add transaction */}
            <button
              onClick={() => setShowForm((o) => !o)}
              className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              {showForm ? <X size={16} /> : <Plus size={16} />}
              {showForm ? 'Cancel' : 'Add'}
            </button>
          </div>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">New Transaction</h2>
            <TransactionForm onSuccess={handleTransactionAdded} />
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {/* Summary cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 h-20 animate-pulse" />
            ))}
          </div>
        ) : (
          <Dashboard transactions={transactions} selectedYear={year} selectedMonth={month} />
        )}

        {/* Chart */}
        <Chart key={`${year}-${month}-${chartRefreshToken}`} year={year} month={month} refreshToken={chartRefreshToken} />
      </main>
    </div>
  );
}
