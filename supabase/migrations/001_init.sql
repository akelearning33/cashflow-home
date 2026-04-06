-- ============================================================
-- CashFlow Home — Initial Schema
-- Run this in the Supabase SQL Editor or via Supabase CLI
-- ============================================================

-- ----------------------------------------------------------------
-- 1. PROFILES TABLE
--    Extends auth.users. email is stored here for admin panel display.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email       TEXT        NOT NULL,
  full_name   TEXT        NOT NULL,
  role        TEXT        NOT NULL DEFAULT 'member'
                          CHECK (role IN ('admin', 'member')),
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------
-- 2. TRANSACTIONS TABLE
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type        TEXT        NOT NULL CHECK (type IN ('income', 'expense')),
  amount      NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  category    TEXT        NOT NULL,
  date        DATE        NOT NULL,
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Index for date-range queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_date
  ON public.transactions (user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_date
  ON public.transactions (date DESC);

-- ----------------------------------------------------------------
-- 3. ENABLE ROW LEVEL SECURITY
-- ----------------------------------------------------------------
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- 4. RLS POLICIES — profiles
-- ----------------------------------------------------------------

-- Any authenticated user can read their own profile
CREATE POLICY "profiles: read own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Admin can read all profiles
CREATE POLICY "profiles: admin read all"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Admin can update any profile (role, is_active)
CREATE POLICY "profiles: admin update"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Service role handles inserts via Edge Functions (no RLS policy needed for service_role)
-- Allow insert for authenticated user on their own row (self-registration fallback)
CREATE POLICY "profiles: insert own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------------------
-- 5. RLS POLICIES — transactions
-- ----------------------------------------------------------------

-- Member: full CRUD on own transactions
CREATE POLICY "transactions: member select own"
  ON public.transactions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "transactions: member insert own"
  ON public.transactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "transactions: member update own"
  ON public.transactions FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "transactions: member delete own"
  ON public.transactions FOR DELETE
  USING (user_id = auth.uid());

-- Admin: can SELECT all transactions
CREATE POLICY "transactions: admin select all"
  ON public.transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ----------------------------------------------------------------
-- 6. AUTO-CREATE PROFILE ON SIGNUP (trigger)
--    Fires when a new row is inserted into auth.users.
--    The invite-user Edge Function also upserts the profile,
--    so this is a safety net for direct sign-up flows.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'member')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
