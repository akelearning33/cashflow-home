import { describe, expect, it } from 'vitest';
import type { Transaction } from '../src/types';
import { summarizeByCategory, summarizeByMonth, summarizeTransactions, sortTransactionsForReport } from '../src/utils/report';

function makeTransaction(index: number): Transaction {
  const day = String((index % 28) + 1).padStart(2, '0');
  return {
    id: `transaction-${index}`,
    user_id: 'user-1',
    type: index % 2 === 0 ? 'income' : 'expense',
    amount: index % 2 === 0 ? 100 : 40,
    category: index % 2 === 0 ? 'เงินเดือน' : 'อาหาร',
    category_id: index % 2 === 0 ? 'income-salary' : 'expense-food',
    date: `2026-${String((index % 12) + 1).padStart(2, '0')}-${day}`,
    note: `รายการที่ ${index + 1}`,
    deleted_at: null,
    created_at: `2026-01-01T00:${String(index).padStart(2, '0')}:00.000Z`,
  };
}

describe('report utilities', () => {
  it('summarizes 100 transactions consistently', () => {
    const transactions = Array.from({ length: 100 }, (_, index) => makeTransaction(index));
    const summary = summarizeTransactions(transactions);

    expect(summary).toEqual({ income: 5000, expense: 2000, net: 3000 });
    expect(summarizeByCategory(transactions)).toEqual([
      { name: 'เงินเดือน', type: 'income', amount: 5000, count: 50 },
      { name: 'อาหาร', type: 'expense', amount: 2000, count: 50 },
    ]);
    expect(summarizeByMonth(transactions, 2026)).toHaveLength(12);
  });

  it('sorts report rows by date, creation time, and id', () => {
    const transactions = [makeTransaction(10), makeTransaction(2), makeTransaction(3)];
    const sorted = sortTransactionsForReport(transactions);

    expect(sorted.map((transaction) => transaction.id)).toEqual(['transaction-2', 'transaction-3', 'transaction-10']);
  });
});
