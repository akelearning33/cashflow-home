import { useState, useEffect, useMemo } from 'react';
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { TransactionItem } from '../components/TransactionItem';
import { TransactionForm } from '../components/TransactionForm';
import { useTransactions } from '../hooks/useTransactions';
import { formatCurrency } from '../utils/formatCurrency';
import { getCategoryColor } from '../utils/categoryColors';
import type { TransactionType } from '../types';

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
const MONTHS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' },
  { value: 3, label: 'March' }, { value: 4, label: 'April' },
  { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' },
  { value: 9, label: 'September' }, { value: 10, label: 'October' },
  { value: 11, label: 'November' }, { value: 12, label: 'December' },
];

type FilterType = TransactionType | 'all';

export function TransactionsPage() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [typeFilter, setTypeFilter] = useState<FilterType>('expense');
  const [showForm, setShowForm] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const { transactions, loading, error, fetchTransactions, deleteTransaction } = useTransactions();

  useEffect(() => {
    fetchTransactions(year, month, typeFilter);
  }, [year, month, typeFilter, fetchTransactions]);

  const grouped = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      const signed = t.type === 'income' ? Number(t.amount) : -Number(t.amount);
      map.set(t.category, (map.get(t.category) ?? 0) + signed);
    }
    const absTotal = Array.from(map.values()).reduce((s, v) => s + Math.abs(v), 0);
    return Array.from(map.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        pct: absTotal > 0 ? Math.round((Math.abs(amount) / absTotal) * 100) : 0,
        items: transactions.filter((t) => t.category === category),
      }))
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  }, [transactions]);

  const total = useMemo(
    () => transactions.reduce((s, t) => s + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0),
    [transactions]
  );

  async function handleDelete(id: string) {
    try {
      await deleteTransaction(id);
      fetchTransactions(year, month, typeFilter);
    } catch (err) {
      alert('Failed to delete transaction. Please try again.');
      throw err;
    }
  }

  function handleTransactionAdded() {
    setShowForm(false);
    fetchTransactions(year, month, typeFilter);
  }

  const monthLabel = MONTHS.find((m) => m.value === month)?.label ?? '';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Transactions</h1>
          <button
            onClick={() => setShowForm((o) => !o)}
            className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Cancel' : 'Add'}
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">New Transaction</h2>
            <TransactionForm onSuccess={handleTransactionAdded} />
          </div>
        )}

        {/* Main card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

          {/* Expense / Income / All tabs */}
          <div className="flex border-b border-gray-100">
            {([
              { value: 'expense', label: 'Expenses', indicator: '', indicatorClass: 'text-red-500' },
              { value: 'income',  label: 'Income',   indicator: '', indicatorClass: 'text-green-500' },
              { value: 'all',     label: 'All',      indicator: null, indicatorClass: '' },
            ] as { value: FilterType; label: string; indicator: string | null; indicatorClass: string }[]).map(({ value, label, indicator, indicatorClass }) => (
              <button
                key={value}
                onClick={() => { setTypeFilter(value); setExpandedCategory(null); }}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  typeFilter === value
                    ? value === 'expense'
                      ? 'text-red-600 border-b-2 border-red-500'
                      : value === 'income'
                      ? 'text-green-600 border-b-2 border-green-500'
                      : 'text-indigo-600 border-b-2 border-indigo-500'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {indicator && <span className={`mr-1 ${indicatorClass}`}>{indicator}</span>}
                {label}
              </button>
            ))}
          </div>

          {/* Month / Year selectors */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="p-4 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-red-600 text-sm bg-red-50 px-4 py-3">{error}</p>
          )}

          {/* Empty state */}
          {!loading && !error && grouped.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              No transactions found for this period.
            </div>
          )}

          {/* Content */}
          {!loading && !error && grouped.length > 0 && (
            <>
              {/* Total */}
              <div className="px-4 pt-4 pb-2">
                <p className={`text-2xl font-bold ${total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {total < 0 ? '–' : '+'}{formatCurrency(Math.abs(total))}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{monthLabel} {year}</p>
              </div>

              {/* Segmented bar */}
              <div className="px-4 pb-4">
                <div className="flex h-3 rounded-full overflow-hidden gap-px">
                  {grouped.map((g, i) => (
                    <div
                      key={g.category}
                      title={`${g.category} ${g.pct}%`}
                      style={{
                        width: `${g.pct}%`,
                        backgroundColor: getCategoryColor(g.category, i),
                        minWidth: g.pct > 0 ? '3px' : '0',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Category rows */}
              <div className="divide-y divide-gray-50">
                {grouped.map((g, i) => (
                  <div key={g.category}>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
                      onClick={() =>
                        setExpandedCategory(expandedCategory === g.category ? null : g.category)
                      }
                    >
                      {/* Category color avatar */}
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
                        style={{ backgroundColor: getCategoryColor(g.category, i) }}
                      >
                        {g.category.charAt(0).toUpperCase()}
                      </div>

                      {/* Name */}
                      <span className="flex-1 text-sm font-medium text-gray-800">
                        {g.category}
                      </span>

                      {/* Percentage */}
                      <span className="text-sm text-gray-400 w-10 text-right">{g.pct}%</span>

                      {/* Amount */}
                      <span className={`text-sm font-semibold w-28 text-right ${
                        g.amount >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {g.amount >= 0 ? '+' : '–'}
                        {formatCurrency(Math.abs(g.amount))}
                      </span>

                      {/* Expand icon */}
                      {expandedCategory === g.category
                        ? <ChevronUp size={15} className="text-gray-400 flex-shrink-0" />
                        : <ChevronDown size={15} className="text-gray-400 flex-shrink-0" />
                      }
                    </button>

                    {/* Individual transactions (expanded) */}
                    {expandedCategory === g.category && (
                      <div className="bg-gray-50 divide-y divide-gray-100">
                        {g.items.map((t) => (
                          <TransactionItem key={t.id} transaction={t} onDelete={handleDelete} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
