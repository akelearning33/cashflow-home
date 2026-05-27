-- ============================================================
-- FIX: Category RLS Policies
-- Run this in Supabase SQL Editor to enforce proper access control.
--
-- After running this script:
--   - Users can only see system defaults + their own custom categories
--   - Admin can manage system defaults (user_id IS NULL) only
--   - Admin CANNOT see/edit/delete other users' custom categories
-- ============================================================

-- ----------------------------------------------------------------
-- 1. DROP ALL existing category policies (clean slate)
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "categories: read own and system"   ON public.categories;
DROP POLICY IF EXISTS "categories: user insert own"       ON public.categories;
DROP POLICY IF EXISTS "categories: user update own"       ON public.categories;
DROP POLICY IF EXISTS "categories: user delete own"       ON public.categories;
DROP POLICY IF EXISTS "categories: admin manage system"   ON public.categories;

-- Drop any legacy / old policies that may still exist
DROP POLICY IF EXISTS "categories: admin insert"          ON public.categories;
DROP POLICY IF EXISTS "categories: admin update"          ON public.categories;
DROP POLICY IF EXISTS "categories: admin delete"          ON public.categories;
DROP POLICY IF EXISTS "categories: public read"           ON public.categories;
DROP POLICY IF EXISTS "categories: admin read all"        ON public.categories;
DROP POLICY IF EXISTS "categories: admin update all"      ON public.categories;
DROP POLICY IF EXISTS "categories: admin delete all"      ON public.categories;

-- Also drop any other common policy names that might exist
DROP POLICY IF EXISTS "Enable read access for all users"  ON public.categories;
DROP POLICY IF EXISTS "Enable insert for all users"       ON public.categories;
DROP POLICY IF EXISTS "Enable update for all users"       ON public.categories;
DROP POLICY IF EXISTS "Enable delete for all users"       ON public.categories;
DROP POLICY IF EXISTS "Enable read access for authenticated users only"  ON public.categories;
DROP POLICY IF EXISTS "Enable insert for authenticated users only"       ON public.categories;
DROP POLICY IF EXISTS "Enable update for authenticated users only"       ON public.categories;
DROP POLICY IF EXISTS "Enable delete for authenticated users only"       ON public.categories;

-- ----------------------------------------------------------------
-- 2. MAKE SURE RLS is enabled
-- ----------------------------------------------------------------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- 3. CREATE NEW (CORRECT) POLICIES
-- ----------------------------------------------------------------

-- Everyone can SELECT system defaults + their own categories ONLY
CREATE POLICY "categories: read own and system"
  ON public.categories FOR SELECT
  USING (user_id IS NULL OR user_id = auth.uid());

-- Users can INSERT their own categories only
CREATE POLICY "categories: user insert own"
  ON public.categories FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can UPDATE their own categories only (not system defaults, not other users')
CREATE POLICY "categories: user update own"
  ON public.categories FOR UPDATE
  USING (user_id = auth.uid());

-- Users can DELETE their own categories only (not system defaults, not other users')
CREATE POLICY "categories: user delete own"
  ON public.categories FOR DELETE
  USING (user_id = auth.uid());

-- Admin can fully manage system defaults ONLY (user_id IS NULL)
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

-- ----------------------------------------------------------------
-- VERIFICATION: Run this query to see all active policies
-- ----------------------------------------------------------------
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'categories';
