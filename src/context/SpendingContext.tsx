// ─────────────────────────────────────────────
//  SpendingContext · Expense tracker state
//  Categories, add/remove, daily/category totals
// ─────────────────────────────────────────────
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react';

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

// ── Some realistic seed data so the UI isn't empty ──
function createSeedData(): Expense[] {
  const today = todayISO();
  const now = Date.now();
  return [
    { id: 's1', amount: 12.50, category: 'food',          note: 'Lunch — sandwich + coffee', date: today, createdAt: now - 3600000 },
    { id: 's2', amount: 8.00,  category: 'transport',     note: 'Uber to office',            date: today, createdAt: now - 7200000 },
    { id: 's3', amount: 4.99,  category: 'entertainment', note: 'Spotify subscription',      date: today, createdAt: now - 10800000 },
    { id: 's4', amount: 22.00, category: 'shopping',      note: 'T-shirt online',            date: today, createdAt: now - 14400000 },
    { id: 's5', amount: 6.50,  category: 'food',          note: 'Morning coffee + pastry',   date: today, createdAt: now - 18000000 },
    { id: 's6', amount: 45.00, category: 'bills',         note: 'Electric bill',             date: today, createdAt: now - 86400000 },
  ];
}

let _nextId = 100;

// ── Provider ──────────────────────────────────
export function SpendingProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses]       = useState<Expense[]>(createSeedData);
  const [dailyBudget, setDailyBudget] = useState(50);

  const addExpense = useCallback(
    (amount: number, category: ExpenseCategory, note: string) => {
      const expense: Expense = {
        id:        String(++_nextId),
        amount,
        category,
        note,
        date:      todayISO(),
        createdAt: Date.now(),
      };
      setExpenses((prev) => [expense, ...prev]);
    },
    [],
  );

  const removeExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
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
