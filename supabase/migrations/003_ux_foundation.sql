-- ============================================================
-- CashFlow Home — UX foundation and personal-data enforcement
-- Safe for an existing project: legacy category text is preserved.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  type        TEXT        NOT NULL CHECK (type IN ('income', 'expense')),
  name        TEXT        NOT NULL,
  user_id     UUID        REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS category_id UUID,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_category_id_fkey'
  ) THEN
    ALTER TABLE public.transactions
      ADD CONSTRAINT transactions_category_id_fkey
      FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_transactions_category_id
  ON public.transactions (category_id);

CREATE INDEX IF NOT EXISTS idx_transactions_active_user_date
  ON public.transactions (user_id, date DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_categories_active
  ON public.categories (user_id, type, is_active, name);

-- Prefer the user's own category when an old row is ambiguous, then fall back
-- to a system category with the same type and name.
UPDATE public.transactions AS txn
SET category_id = COALESCE(
  (
    SELECT category.id
    FROM public.categories AS category
    WHERE category.user_id = txn.user_id
      AND category.type = txn.type
      AND lower(category.name) = lower(txn.category)
    LIMIT 1
  ),
  (
    SELECT category.id
    FROM public.categories AS category
    WHERE category.user_id IS NULL
      AND category.type = txn.type
      AND lower(category.name) = lower(txn.category)
    LIMIT 1
  )
)
WHERE txn.category_id IS NULL;

-- Seed defaults without assuming a particular migration history.
INSERT INTO public.categories (type, name, user_id)
SELECT seed.type, seed.name, NULL
FROM (VALUES
  ('expense', 'อาหาร'),
  ('expense', 'เดินทาง'),
  ('expense', 'ค่าสาธารณูปโภค'),
  ('expense', 'สุขภาพ'),
  ('expense', 'ช้อปปิ้ง'),
  ('expense', 'ความบันเทิง'),
  ('expense', 'อื่น ๆ'),
  ('income', 'เงินเดือน'),
  ('income', 'โบนัส'),
  ('income', 'งานเสริม'),
  ('income', 'อื่น ๆ')
) AS seed(type, name)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.categories AS existing
  WHERE existing.user_id IS NULL
    AND existing.type = seed.type
    AND lower(existing.name) = lower(seed.name)
);

CREATE OR REPLACE FUNCTION public.current_user_is_active()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE((
    SELECT profile.is_active
    FROM public.profiles AS profile
    WHERE profile.id = auth.uid()
  ), false);
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE((
    SELECT profile.role = 'admin' AND profile.is_active
    FROM public.profiles AS profile
    WHERE profile.id = auth.uid()
  ), false);
$$;

REVOKE ALL ON FUNCTION public.current_user_is_active() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_is_active() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated;

-- Profiles: inactive users can still read their own row so the client can show
-- the correct reason, while only another active admin may change a profile.
DROP POLICY IF EXISTS "profiles: read own" ON public.profiles;
DROP POLICY IF EXISTS "profiles: admin read all" ON public.profiles;
DROP POLICY IF EXISTS "profiles: admin update" ON public.profiles;

CREATE POLICY "profiles: read own"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles: admin read all"
  ON public.profiles FOR SELECT
  USING (public.current_user_is_admin());

CREATE POLICY "profiles: admin update"
  ON public.profiles FOR UPDATE
  USING (id <> auth.uid() AND public.current_user_is_admin())
  WITH CHECK (id <> auth.uid() AND public.current_user_is_admin());

-- Transactions: remove legacy admin-wide access and enforce personal ownership.
DROP POLICY IF EXISTS "transactions: member select own" ON public.transactions;
DROP POLICY IF EXISTS "transactions: member insert own" ON public.transactions;
DROP POLICY IF EXISTS "transactions: member update own" ON public.transactions;
DROP POLICY IF EXISTS "transactions: member delete own" ON public.transactions;
DROP POLICY IF EXISTS "transactions: admin select all" ON public.transactions;

CREATE POLICY "transactions: select own active"
  ON public.transactions FOR SELECT
  USING (user_id = auth.uid() AND public.current_user_is_active());

CREATE POLICY "transactions: insert own active"
  ON public.transactions FOR INSERT
  WITH CHECK (user_id = auth.uid() AND public.current_user_is_active());

CREATE POLICY "transactions: update own active"
  ON public.transactions FOR UPDATE
  USING (user_id = auth.uid() AND public.current_user_is_active())
  WITH CHECK (user_id = auth.uid() AND public.current_user_is_active());

CREATE POLICY "transactions: delete own active"
  ON public.transactions FOR DELETE
  USING (user_id = auth.uid() AND public.current_user_is_active());

-- Categories remain personal/system-wide, but inactive accounts lose access.
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories: read own and system" ON public.categories;
DROP POLICY IF EXISTS "categories: user insert own" ON public.categories;
DROP POLICY IF EXISTS "categories: user update own" ON public.categories;
DROP POLICY IF EXISTS "categories: user delete own" ON public.categories;
DROP POLICY IF EXISTS "categories: admin manage system" ON public.categories;

CREATE POLICY "categories: read own and system"
  ON public.categories FOR SELECT
  USING (
    public.current_user_is_active()
    AND (user_id IS NULL OR user_id = auth.uid())
  );

CREATE POLICY "categories: user insert own"
  ON public.categories FOR INSERT
  WITH CHECK (user_id = auth.uid() AND public.current_user_is_active());

CREATE POLICY "categories: user update own"
  ON public.categories FOR UPDATE
  USING (user_id = auth.uid() AND public.current_user_is_active())
  WITH CHECK (user_id = auth.uid() AND public.current_user_is_active());

CREATE POLICY "categories: user delete own"
  ON public.categories FOR DELETE
  USING (user_id = auth.uid() AND public.current_user_is_active());

CREATE POLICY "categories: admin manage system"
  ON public.categories FOR ALL
  USING (user_id IS NULL AND public.current_user_is_admin())
  WITH CHECK (user_id IS NULL AND public.current_user_is_admin());
