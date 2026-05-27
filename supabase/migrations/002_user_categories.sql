-- ============================================================
-- CashFlow Home — Per-User Custom Categories
-- Adds user_id ownership to categories table
-- ============================================================

-- ----------------------------------------------------------------
-- 1. ADD user_id COLUMN
--    NULL = system default (visible to all, admin-managed)
--    UUID = user-owned custom category
-- ----------------------------------------------------------------
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- ----------------------------------------------------------------
-- 2. UNIQUE CONSTRAINT
--    Prevent duplicate category names within the same scope
--    (same user + same type + same name)
--    NULLS NOT DISTINCT ensures system defaults are also unique
-- ----------------------------------------------------------------
ALTER TABLE public.categories
  ADD CONSTRAINT categories_unique_per_scope
  UNIQUE NULLS NOT DISTINCT (user_id, type, name);

-- ----------------------------------------------------------------
-- 3. INDEX for efficient per-user queries
-- ----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_categories_user_id
  ON public.categories (user_id);

-- ----------------------------------------------------------------
-- 4. ENABLE RLS (if not already enabled)
-- ----------------------------------------------------------------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- 5. DROP existing policies (clean slate)
--    Using IF EXISTS to avoid errors if policies don't exist yet
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "categories: read own and system"   ON public.categories;
DROP POLICY IF EXISTS "categories: user insert own"       ON public.categories;
DROP POLICY IF EXISTS "categories: user update own"       ON public.categories;
DROP POLICY IF EXISTS "categories: user delete own"       ON public.categories;
DROP POLICY IF EXISTS "categories: admin manage system"   ON public.categories;
-- Drop any legacy policies that may have existed
DROP POLICY IF EXISTS "categories: admin insert"          ON public.categories;
DROP POLICY IF EXISTS "categories: admin update"          ON public.categories;
DROP POLICY IF EXISTS "categories: admin delete"          ON public.categories;
DROP POLICY IF EXISTS "categories: public read"           ON public.categories;

-- ----------------------------------------------------------------
-- 6. NEW RLS POLICIES
-- ----------------------------------------------------------------

-- Everyone can SELECT system defaults + their own categories
CREATE POLICY "categories: read own and system"
  ON public.categories FOR SELECT
  USING (user_id IS NULL OR user_id = auth.uid());

-- Users can INSERT their own categories only
CREATE POLICY "categories: user insert own"
  ON public.categories FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can UPDATE their own categories only (not system defaults)
CREATE POLICY "categories: user update own"
  ON public.categories FOR UPDATE
  USING (user_id = auth.uid());

-- Users can DELETE their own categories only (not system defaults)
CREATE POLICY "categories: user delete own"
  ON public.categories FOR DELETE
  USING (user_id = auth.uid());

-- Admin can fully manage system defaults (user_id IS NULL)
CREATE POLICY "categories: admin manage system"
  ON public.categories FOR ALL
  USING (
    user_id IS NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    user_id IS NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
