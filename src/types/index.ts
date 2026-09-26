export type UserRole = 'admin' | 'member';
export type TransactionType = 'income' | 'expense';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  category: string;
  category_id: string | null;
  date: string; // ISO date string "YYYY-MM-DD"
  note: string | null;
  recurring_transaction_id?: string | null;
  recurring_month?: string | null;
  recurring_name?: string | null;
  deleted_at: string | null;
  created_at: string;
}

export interface TransactionFormData {
  type: TransactionType;
  amount: string;
  category_id: string;
  category: string;
  date: string;
  note: string;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface MonthlyChartData {
  month: string;
  income: number;
  expense: number;
}

export interface Category {
  id: string;
  type: TransactionType;
  name: string;
  user_id: string | null; // null = system default, UUID = user-owned
  is_active: boolean;
}

export type RecurringTransactionStatus = 'active' | 'paused' | 'cancelled';

export interface RecurringTransaction {
  id: string;
  user_id: string;
  name: string;
  type: TransactionType;
  amount: number;
  category: string;
  category_id: string | null;
  day_of_month: number;
  start_month: string;
  next_run_date: string;
  note: string | null;
  status: RecurringTransactionStatus;
  created_at: string;
  updated_at: string;
}

export interface RecurringTransactionFormData {
  name: string;
  type: TransactionType;
  amount: string;
  category_id: string;
  category: string;
  day_of_month: string;
  start_month: string;
  note: string;
}
