import { Transaction, Category, BudgetInfo } from '../types';
import { getDefaultCategories, getCategoryById } from '../data/categories';

// ============ Keys ============
const KEYS = {
  transactions: 'jz_transactions',
  categories: 'jz_categories',
  budgets: 'jz_budgets',
  version: 'jz_version',
};

const CURRENT_VERSION = 2; // bump to force category reset

// ============ Helpers ============
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ============ Categories ============
export function getCategories(): Category[] {
  const version = load<number>(KEYS.version, 0);
  let cats = load<Category[]>(KEYS.categories, []);
  if (cats.length === 0 || version < CURRENT_VERSION) {
    cats = getDefaultCategories();
    save(KEYS.categories, cats);
    save(KEYS.version, CURRENT_VERSION);
  }
  return cats;
}

export function getCategoryByIdStored(id: string): Category | undefined {
  return getCategories().find(c => c.id === id);
}

// ============ Transactions ============
export function getTransactions(): Transaction[] {
  return load<Transaction[]>(KEYS.transactions, []);
}

export function getTransactionsByMonth(year: number, month: number): Transaction[] {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return getTransactions().filter(t => t.date.startsWith(prefix));
}

export function getTodayTransactions(): Transaction[] {
  const today = toDateStr(new Date());
  return getTransactions().filter(t => t.date === today);
}

export function addTransaction(t: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
  const tx: Transaction = {
    ...t,
    id: genId(),
    createdAt: new Date().toISOString(),
  };
  const all = getTransactions();
  all.unshift(tx);
  save(KEYS.transactions, all);
  return tx;
}

export function deleteTransaction(id: string): void {
  const all = getTransactions().filter(t => t.id !== id);
  save(KEYS.transactions, all);
}

// ============ Budgets ============
interface BudgetEntry {
  categoryId: string;
  amount: number;
}

export function getBudgets(): BudgetEntry[] {
  return load<BudgetEntry[]>(KEYS.budgets, []);
}

export function setBudget(categoryId: string, amount: number): void {
  const budgets = getBudgets().filter(b => b.categoryId !== categoryId);
  if (amount > 0) {
    budgets.push({ categoryId, amount });
  }
  save(KEYS.budgets, budgets);
}

export function getBudgetAlerts(year: number, month: number): BudgetInfo[] {
  const budgets = getBudgets();
  const transactions = getTransactionsByMonth(year, month);
  const categories = getCategories();
  const alerts: BudgetInfo[] = [];

  for (const b of budgets) {
    const cat = categories.find(c => c.id === b.categoryId);
    if (!cat) continue;
    const spent = transactions
      .filter(t => t.categoryId === b.categoryId && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    if (b.amount > 0) {
      alerts.push({
        categoryId: b.categoryId,
        categoryName: cat.name,
        categoryIcon: cat.icon,
        budget: b.amount,
        spent,
        percentage: Math.round((spent / b.amount) * 100),
      });
    }
  }
  return alerts.sort((a, b) => b.percentage - a.percentage);
}

// ============ Stats ============
export function getMonthStats(year: number, month: number) {
  const monthTx = getTransactionsByMonth(year, month);
  const todayTx = getTodayTransactions();

  const totalIncome = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const todayExpense = todayTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const todayIncome = todayTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const budgetAlerts = getBudgetAlerts(year, month);

  return { totalIncome, totalExpense, todayExpense, todayIncome, budgetAlerts };
}

export function getCategoryStats(year: number, month: number) {
  const monthTx = getTransactionsByMonth(year, month);
  const categories = getCategories();
  const expenseTx = monthTx.filter(t => t.type === 'expense');
  const totalExpense = expenseTx.reduce((s, t) => s + t.amount, 0);

  const map = new Map<string, number>();
  for (const t of expenseTx) {
    const cat = categories.find(c => c.id === t.categoryId);
    if (!cat) continue;
    const key = cat.parentId || cat.id;
    map.set(key, (map.get(key) || 0) + t.amount);
  }

  const stats: { categoryId: string; categoryName: string; categoryIcon: string; parentName: string; amount: number; percentage: number }[] = [];
  for (const [catId, amount] of map) {
    const cat = categories.find(c => c.id === catId);
    if (!cat) continue;
    stats.push({
      categoryId: catId,
      categoryName: cat.name,
      categoryIcon: cat.icon,
      parentName: '',
      amount,
      percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 1000) / 10 : 0,
    });
  }
  return stats.sort((a, b) => b.amount - a.amount);
}

// ============ Export / Import ============
export function exportData(): string {
  return JSON.stringify({
    transactions: getTransactions(),
    categories: getCategories(),
    budgets: getBudgets(),
  }, null, 2);
}

export function importData(json: string): boolean {
  try {
    const data = JSON.parse(json);
    if (data.transactions) save(KEYS.transactions, data.transactions);
    if (data.categories) save(KEYS.categories, data.categories);
    if (data.budgets) save(KEYS.budgets, data.budgets);
    return true;
  } catch {
    return false;
  }
}

// ============ Helpers ============
export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatMoney(n: number): string {
  return '¥' + n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
