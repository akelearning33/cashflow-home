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
  date: string; // ISO date string "YYYY-MM-DD"
  note: string | null;
  created_at: string;
}

export interface TransactionFormData {
  type: TransactionType;
  amount: string;
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
