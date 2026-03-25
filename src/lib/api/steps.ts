// ─────────────────────────────────────────────
//  src/lib/api/steps.ts
//  Upsert / fetch daily step counts
// ─────────────────────────────────────────────
import { supabase } from '../supabase';
import type { Database } from '../database.types';

export type DailyStepsRow = Database['public']['Tables']['daily_steps']['Row'];

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── Upsert today's step count ─────────────────
export async function upsertSteps(
  steps: number,
  goal:  number = 10_000,
): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const today = todayISO();

  const { error } = await supabase
    .from('daily_steps')
    .upsert(
      { user_id: user.id, date: today, steps, goal, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,date' },
    );

  if (error) {
    console.error('[steps] upsertSteps:', error.message);
    return { error: error.message };
  }
  return { error: null };
}

// ── Fetch last N days of steps ────────────────
export async function fetchRecentSteps(days: number = 7): Promise<DailyStepsRow[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceISO = since.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('daily_steps')
    .select('*')
    .gte('date', sinceISO)
    .order('date', { ascending: false });

  if (error) {
    console.error('[steps] fetchRecentSteps:', error.message);
    return [];
  }
  return data ?? [];
}
