// ─────────────────────────────────────────────
//  src/lib/supabase.ts
//  Supabase client — single instance for the app.
//
//  SETUP:
//  1. Create a free project at https://supabase.com
//  2. Go to Settings → API
//  3. Replace SUPABASE_URL and SUPABASE_ANON_KEY below
//  4. Run supabase/schema.sql in your project's SQL Editor
// ─────────────────────────────────────────────
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// ── Replace with your project values ─────────
const SUPABASE_URL  = 'https://YOUR_PROJECT_REF.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
// ─────────────────────────────────────────────

if (
  SUPABASE_URL.includes('YOUR_PROJECT_REF') ||
  SUPABASE_ANON_KEY.includes('YOUR_ANON_KEY')
) {
  console.warn(
    '[DayLens] Supabase credentials not set.\n' +
    'Edit src/lib/supabase.ts and replace SUPABASE_URL and SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage:          AsyncStorage,
    autoRefreshToken: true,
    persistSession:   true,
    detectSessionInUrl: false,
  },
});
