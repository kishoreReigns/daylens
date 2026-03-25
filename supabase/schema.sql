-- ─────────────────────────────────────────────
--  DayLens AI · Supabase Schema
--  Run this in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────

-- ── 1. User profiles ─────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID    REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name     TEXT    NOT NULL DEFAULT '',
  daily_budget  NUMERIC(10,2) NOT NULL DEFAULT 50,
  step_goal     INTEGER NOT NULL DEFAULT 10000,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create a profile when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── 2. Expenses ───────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount     NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  category   TEXT        NOT NULL,
  note       TEXT        NOT NULL DEFAULT '',
  date       DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS expenses_user_date_idx ON expenses (user_id, date DESC);

-- ── 3. Daily steps ────────────────────────────
CREATE TABLE IF NOT EXISTS daily_steps (
  id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date       DATE        NOT NULL DEFAULT CURRENT_DATE,
  steps      INTEGER     NOT NULL DEFAULT 0 CHECK (steps >= 0),
  goal       INTEGER     NOT NULL DEFAULT 10000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS daily_steps_user_date_idx ON daily_steps (user_id, date DESC);

-- ── 4. Screen-time daily log ──────────────────
CREATE TABLE IF NOT EXISTS screen_time_logs (
  id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date       DATE        NOT NULL DEFAULT CURRENT_DATE,
  total_ms   BIGINT      NOT NULL DEFAULT 0 CHECK (total_ms >= 0),
  apps_json  JSONB       NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS screen_time_user_date_idx ON screen_time_logs (user_id, date DESC);

-- ─────────────────────────────────────────────
--  Row Level Security — every user can only see
--  and modify their own rows. Enforced at DB level.
-- ─────────────────────────────────────────────

ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_steps     ENABLE ROW LEVEL SECURITY;
ALTER TABLE screen_time_logs ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- expenses
CREATE POLICY "Users can view own expenses"
  ON expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses"
  ON expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE USING (auth.uid() = user_id);

-- daily_steps
CREATE POLICY "Users can view own steps"
  ON daily_steps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own steps"
  ON daily_steps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own steps"
  ON daily_steps FOR UPDATE USING (auth.uid() = user_id);

-- screen_time_logs
CREATE POLICY "Users can view own screen time"
  ON screen_time_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own screen time"
  ON screen_time_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own screen time"
  ON screen_time_logs FOR UPDATE USING (auth.uid() = user_id);
