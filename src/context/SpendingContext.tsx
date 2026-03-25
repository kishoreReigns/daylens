// ─────────────────────────────────────────────
//  SpendingContext · Expense tracker state
//  Categories, add/remove, daily/category totals
// ─────────────────────────────────────────────
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useAuth }               from './AuthContext';
import * as ExpensesAPI          from '../lib/api/expenses';

// ── Category definitions ──────────────────────
export type ExpenseCategory =
  | 'food'
  | 'shopping'
  | 'bills'
  | 'transport'
  | 'entertainment'
  | 'health'
  | 'education'
  | 'other';

export interface CategoryMeta {
  key:   ExpenseCategory;
  label: string;
  emoji: string;
  color: string;        // accent color (hex)
}

export const CATEGORIES: CategoryMeta[] = [
  { key: 'food',          label: 'Food & Drinks',  emoji: '🍔', color: '#F97316' },
  { key: 'shopping',      label: 'Shopping',        emoji: '🛍️', color: '#EC4899' },
  { key: 'bills',         label: 'Bills & Utilities', emoji: '📄', color: '#38BDF8' },
  { key: 'transport',     label: 'Transport',       emoji: '🚗', color: '#10B981' },
  { key: 'entertainment', label: 'Entertainment',   emoji: '🎬', color: '#8B5CF6' },
  { key: 'health',        label: 'Health',           emoji: '💊', color: '#2DD4BF' },
  { key: 'education',     label: 'Education',        emoji: '📚', color: '#F59E0B' },
  { key: 'other',         label: 'Other',            emoji: '📦', color: '#9C94BF' },
];

export function getCategoryMeta(key: ExpenseCategory): CategoryMeta {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[CATEGORIES.length - 1];
}

// ── Expense type ──────────────────────────────
export interface Expense {
  id:        string;
  amount:    number;
  category:  ExpenseCategory;
  note:      string;
  date:      string; // ISO date string
  createdAt: number; // timestamp
}

// ── Category summary ──────────────────────────
export interface CategorySummary {
  category: ExpenseCategory;
  total:    number;
  count:    number;
  percent:  number; // 0–100
}

// ── Context value ─────────────────────────────
export interface SpendingContextValue {
  expenses:          Expense[];
  addExpense:        (amount: number, category: ExpenseCategory, note: string) => void;
  removeExpense:     (id: string) => void;
  todayTotal:        number;
  todayExpenses:     Expense[];
  categorySummary:   CategorySummary[];
  monthTotal:        number;
  dailyBudget:       number;
  setDailyBudget:    (v: number) => void;
  budgetProgress:    number; // 0–1
}

const SpendingContext = createContext<SpendingContextValue>({
  expenses:          [],
  addExpense:        () => {},
  removeExpense:     () => {},
  todayTotal:        0,
  todayExpenses:     [],
  categorySummary:   [],
  monthTotal:        0,
  dailyBudget:       50,
  setDailyBudget:    () => {},
  budgetProgress:    0,
});

// ── Helper: ISO date for "today" ──────────────
function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function monthPrefix(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Map a DB row to the local Expense shape */
function rowToExpense(row: ExpensesAPI.ExpenseRow): Expense {
  return {
    id:        row.id,
    amount:    row.amount,
    category:  row.category as ExpenseCategory,
    note:      row.note ?? '',
    date:      row.date,
    createdAt: new Date(row.created_at).getTime(),
  };
}

// ── Provider ──────────────────────────────────
export function SpendingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [expenses, setExpenses]       = useState<Expense[]>([]);
  const [dailyBudget, setDailyBudget] = useState(50);

  // ── Load expenses from Supabase whenever the user changes ──
  useEffect(() => {
    if (!user) {
      setExpenses([]);
      return;
    }
    ExpensesAPI.fetchExpenses().then((rows) => {
      setExpenses(rows.map(rowToExpense));
    });
  }, [user]);

  const addExpense = useCallback(
    async (amount: number, category: ExpenseCategory, note: string) => {
      const { id, error } = await ExpensesAPI.insertExpense(amount, category, note);
      if (error || !id) {
        console.error('[SpendingContext] addExpense failed:', error);
        return;
      }
      const newEntry: Expense = {
        id,
        amount,
        category,
        note,
        date:      todayISO(),
        createdAt: Date.now(),
      };
      setExpenses((prev) => [newEntry, ...prev]);
    },
    [],
  );

  const removeExpense = useCallback(async (id: string) => {
    // Optimistic update
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    const { error } = await ExpensesAPI.deleteExpense(id);
    if (error) {
      console.error('[SpendingContext] removeExpense failed:', error);
      // Rollback: re-fetch to restore consistent state
      ExpensesAPI.fetchExpenses().then((rows) => setExpenses(rows.map(rowToExpense)));
    }
  }, []);

  // ── Derived data ────────────────────────────
  const today = todayISO();
  const month = monthPrefix();

  const todayExpenses = useMemo(
    () => expenses.filter((e) => e.date === today),
    [expenses, today],
  );

  const todayTotal = useMemo(
    () => todayExpenses.reduce((s, e) => s + e.amount, 0),
    [todayExpenses],
  );

  const monthTotal = useMemo(
    () => expenses.filter((e) => e.date.startsWith(month)).reduce((s, e) => s + e.amount, 0),
    [expenses, month],
  );

  const categorySummary = useMemo<CategorySummary[]>(() => {
    const map: Record<string, { total: number; count: number }> = {};
    for (const e of todayExpenses) {
      if (!map[e.category]) map[e.category] = { total: 0, count: 0 };
      map[e.category].total += e.amount;
      map[e.category].count += 1;
    }
    const total = todayTotal || 1; // avoid /0
    return CATEGORIES
      .filter((c) => map[c.key])
      .map((c) => ({
        category: c.key,
        total:    map[c.key].total,
        count:    map[c.key].count,
        percent:  Math.round((map[c.key].total / total) * 100),
      }))
      .sort((a, b) => b.total - a.total);
  }, [todayExpenses, todayTotal]);

  const budgetProgress = Math.min(todayTotal / (dailyBudget || 1), 1);

  return (
    <SpendingContext.Provider
      value={{
        expenses,
        addExpense,
        removeExpense,
        todayTotal,
        todayExpenses,
        categorySummary,
        monthTotal,
        dailyBudget,
        setDailyBudget,
        budgetProgress,
      }}
    >
      {children}
    </SpendingContext.Provider>
  );
}

export function useSpending(): SpendingContextValue {
  return useContext(SpendingContext);
}
