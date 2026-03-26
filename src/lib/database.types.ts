// ─────────────────────────────────────────────
//  src/lib/database.types.ts
//  TypeScript types auto-derived from the schema.
//  Regenerate with: npx supabase gen types typescript
// ─────────────────────────────────────────────

export type Json =
    | string | number | boolean | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    full_name: string;
                    daily_budget: number;
                    step_goal: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    full_name?: string;
                    daily_budget?: number;
                    step_goal?: number;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    full_name?: string;
                    daily_budget?: number;
                    step_goal?: number;
                    updated_at?: string;
                };
                Relationships: [];
            };
            expenses: {
                Row: {
                    id: string;
                    user_id: string;
                    amount: number;
                    category: string;
                    note: string;
                    date: string;   // YYYY-MM-DD
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    amount: number;
                    category: string;
                    note?: string;
                    date?: string;
                    created_at?: string;
                };
                Update: {
                    amount?: number;
                    category?: string;
                    note?: string;
                };
                Relationships: [];
            };
            daily_steps: {
                Row: {
                    id: string;
                    user_id: string;
                    date: string;
                    steps: number;
                    goal: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    date?: string;
                    steps: number;
                    goal?: number;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    steps?: number;
                    goal?: number;
                    updated_at?: string;
                };
                Relationships: [];
            };
            screen_time_logs: {
                Row: {
                    id: string;
                    user_id: string;
                    date: string;
                    total_ms: number;
                    apps_json: Json;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    date?: string;
                    total_ms: number;
                    apps_json?: Json;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    total_ms?: number;
                    apps_json?: Json;
                    updated_at?: string;
                };
                Relationships: [];
            };
        };
        Views: { [_ in never]: never };
        Functions: { [_ in never]: never };
        Enums: { [_ in never]: never };
        CompositeTypes: { [_ in never]: never };
    };
}
