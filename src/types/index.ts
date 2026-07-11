export interface Category {
  id: string;
  name: string;
  icon: string;
  type: 'income' | 'expense';
  parentId: string | null;
  budget: number | null;
  sortOrder: number;
}

export interface Transaction {
  id: string;
  categoryId: string;
  amount: number;
  type: 'income' | 'expense';
  note: string;
  date: string; // YYYY-MM-DD
  createdAt: string; // ISO
  userId?: string;
}

export interface BudgetInfo {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  budget: number;
  spent: number;
  percentage: number;
}

export interface MonthStats {
  totalIncome: number;
  totalExpense: number;
  todayExpense: number;
  todayIncome: number;
  budgetAlerts: BudgetInfo[];
}

export interface CategoryStat {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  parentName: string;
  amount: number;
  percentage: number;
}

export type Page = 'home' | 'history' | 'charts' | 'settings';
