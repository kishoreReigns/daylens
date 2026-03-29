// ─────────────────────────────────────────────
//  src/lib/api/auth.ts
//  Supabase Auth — sign-up, sign-in, sign-out,
//  profile read/update
// ─────────────────────────────────────────────
import { supabase } from '../supabase';
import type { Database } from '../database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];

// ── Sign up ───────────────────────────────────
export async function signUp(
    email: string,
    password: string,
    fullName: string,
): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { full_name: fullName.trim() } },
    });
    return { error: error?.message ?? null };
}

// ── Sign in ───────────────────────────────────
export async function signIn(
    email: string,
    password: string,
): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
    });
    return { error: error?.message ?? null };
}

// ── Sign in with Google ID token ──────────────
export async function signInWithGoogleIdToken(
    idToken: string,
): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
    });
    return { error: error?.message ?? null };
}

// ── Sign out ──────────────────────────────────
export async function signOut(): Promise<void> {
    await supabase.auth.signOut();
}

// ── Get current user's profile ────────────────
export async function getProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('[auth] getProfile:', error.message);
        return null;
    }
    return data;
}

// ── Update profile ────────────────────────────
export async function updateProfile(
    updates: Database['public']['Tables']['profiles']['Update'],
): Promise<{ error: string | null }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id);

    return { error: error?.message ?? null };
}
