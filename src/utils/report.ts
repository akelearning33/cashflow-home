import type { MonthlyChartData, Transaction, TransactionType } from '../types';

export interface TransactionSummary {
  income: number;
  expense: number;
  net: number;
}

export interface CategoryReportSummary {
  name: string;
  type: TransactionType;
  amount: number;
  count: number;
}

export function summarizeTransactions(transactions: Transaction[]): TransactionSummary {
  const totals = transactions.reduce(
    (summary, transaction) => {
      summary[transaction.type] += Number(transaction.amount);
      return summary;
    },
    { income: 0, expense: 0 }
  );

  return { ...totals, net: totals.income - totals.expense };
}

export function summarizeByCategory(transactions: Transaction[]): CategoryReportSummary[] {
  const summary = new Map<string, CategoryReportSummary>();

  for (const transaction of transactions) {
    const key = `${transaction.type}:${transaction.category_id ?? transaction.category}`;
    const current = summary.get(key) ?? {
      name: transaction.category,
      type: transaction.type,
      amount: 0,
      count: 0,
    };
    current.amount += Number(transaction.amount);
    current.count += 1;
    summary.set(key, current);
  }

  return Array.from(summary.values()).sort((left, right) => {
    if (left.type !== right.type) return left.type === 'income' ? -1 : 1;
    return right.amount - left.amount;
  });
}

export function summarizeByMonth(transactions: Transaction[], year: number): MonthlyChartData[] {
  const months = Array.from({ length: 12 }, (_, index) => ({
    month: String(index + 1),
    income: 0,
    expense: 0,
  }));

  for (const transaction of transactions) {
    if (Number(transaction.date.slice(0, 4)) !== year) continue;
    const monthIndex = Number(transaction.date.slice(5, 7)) - 1;
    const month = months[monthIndex];
    if (!month) continue;
    month[transaction.type] += Number(transaction.amount);
  }

  return months;
}

export function sortTransactionsForReport(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((left, right) => {
    const dateOrder = left.date.localeCompare(right.date);
    if (dateOrder !== 0) return dateOrder;
    const createdOrder = left.created_at.localeCompare(right.created_at);
    if (createdOrder !== 0) return createdOrder;
    return left.id.localeCompare(right.id);
  });
}
