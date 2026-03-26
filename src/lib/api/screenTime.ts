// ─────────────────────────────────────────────
//  src/lib/api/screenTime.ts
//  Upsert / fetch daily screen-time logs
// ─────────────────────────────────────────────
import { supabase } from '../supabase';
import type { Database } from '../database.types';

// Shape of a single app's usage entry stored in apps_json
export interface AppUsage {
    appName: string;
    packageName: string;
    totalTimeMs: number;
}

export type ScreenTimeRow = Database['public']['Tables']['screen_time_logs']['Row'];

function todayISO(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── Upsert today's screen-time snapshot ───────
export async function upsertScreenTime(
    totalMs: number,
    apps: AppUsage[],
): Promise<{ error: string | null }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const today = todayISO();

    const { error } = await supabase
        .from('screen_time_logs')
        .upsert(
            {
                user_id: user.id,
                date: today,
                total_ms: totalMs,
                apps_json: apps as any,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,date' },
        );

    if (error) {
        console.error('[screenTime] upsertScreenTime:', error.message);
        return { error: error.message };
    }
    return { error: null };
}

// ── Fetch last N days of screen-time logs ─────
export async function fetchRecentScreenTime(days: number = 7): Promise<ScreenTimeRow[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceISO = since.toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('screen_time_logs')
        .select('*')
        .gte('date', sinceISO)
        .order('date', { ascending: false });

    if (error) {
        console.error('[screenTime] fetchRecentScreenTime:', error.message);
        return [];
    }
    return data ?? [];
}
