// ─────────────────────────────────────────────
//  src/lib/api/expenses.ts
//  CRUD for the expenses table
// ─────────────────────────────────────────────
import { supabase } from '../supabase';
import type { Database } from '../database.types';

export type ExpenseRow = Database['public']['Tables']['expenses']['Row'];

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── Fetch all expenses for the current user ───
export async function fetchExpenses(): Promise<ExpenseRow[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[expenses] fetchExpenses:', error.message);
    return [];
  }
  return data ?? [];
}

// ── Fetch only today's expenses ───────────────
export async function fetchTodayExpenses(): Promise<ExpenseRow[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('date', todayISO())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[expenses] fetchTodayExpenses:', error.message);
    return [];
  }
  return data ?? [];
}

// ── Insert a new expense ──────────────────────
export async function insertExpense(
  amount:   number,
  category: string,
  note:     string,
): Promise<{ id: string | null; error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { id: null, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      user_id:  user.id,
      amount,
      category,
      note:     note.trim(),
      date:     todayISO(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('[expenses] insertExpense:', error.message);
    return { id: null, error: error.message };
  }
  return { id: data.id, error: null };
}

// ── Delete an expense ─────────────────────────
export async function deleteExpense(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[expenses] deleteExpense:', error.message);
    return { error: error.message };
  }
  return { error: null };
}
