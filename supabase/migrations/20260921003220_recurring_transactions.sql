-- ============================================================
-- CashFlow Home — recurring monthly transactions
-- ============================================================

-- Keep the source rule on generated transactions so users can see where a
-- recurring row came from without changing the existing transaction flow.
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS recurring_transaction_id UUID,
  ADD COLUMN IF NOT EXISTS recurring_month DATE,
  ADD COLUMN IF NOT EXISTS recurring_name TEXT;

CREATE TABLE IF NOT EXISTS public.recurring_transactions (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name          TEXT        NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 120),
  type          TEXT        NOT NULL CHECK (type IN ('income', 'expense')),
  amount        NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  category_id   UUID        REFERENCES public.categories(id) ON DELETE SET NULL,
  category      TEXT        NOT NULL,
  day_of_month SMALLINT    NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
  start_month   DATE        NOT NULL CHECK (start_month = date_trunc('month', start_month)::date),
  next_run_date DATE        NOT NULL,
  note          TEXT,
  status        TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The table must exist before the foreign key above is added on projects that
-- run migrations in a single transaction.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_recurring_transaction_id_fkey'
  ) THEN
    ALTER TABLE public.transactions
      ADD CONSTRAINT transactions_recurring_transaction_id_fkey
      FOREIGN KEY (recurring_transaction_id)
      REFERENCES public.recurring_transactions(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_recurring_transactions_user_status
  ON public.recurring_transactions (user_id, status, next_run_date);

CREATE INDEX IF NOT EXISTS idx_transactions_recurring_transaction
  ON public.transactions (recurring_transaction_id, recurring_month);

-- A generated month is unique even if a cron run is retried or overlaps with
-- a user opening the app. A soft-deleted generated row still reserves its slot.
-- A regular unique index is used so PostgreSQL can infer it in ON CONFLICT;
-- nullable legacy rows can still coexist because NULLs are distinct.
DROP INDEX IF EXISTS public.idx_transactions_recurring_month_unique;
CREATE UNIQUE INDEX idx_transactions_recurring_month_unique
  ON public.transactions (recurring_transaction_id, recurring_month);

ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recurring: select own active" ON public.recurring_transactions;
DROP POLICY IF EXISTS "recurring: insert own active" ON public.recurring_transactions;
DROP POLICY IF EXISTS "recurring: update own active" ON public.recurring_transactions;
DROP POLICY IF EXISTS "recurring: delete own active" ON public.recurring_transactions;

CREATE POLICY "recurring: select own active"
  ON public.recurring_transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND public.current_user_is_active());

CREATE POLICY "recurring: insert own active"
  ON public.recurring_transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.current_user_is_active());

CREATE POLICY "recurring: update own active"
  ON public.recurring_transactions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND public.current_user_is_active())
  WITH CHECK (user_id = auth.uid() AND public.current_user_is_active());

CREATE POLICY "recurring: delete own active"
  ON public.recurring_transactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND public.current_user_is_active());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recurring_transactions TO authenticated;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.recurring_run_date(p_month DATE, p_day INTEGER)
RETURNS DATE
LANGUAGE SQL
IMMUTABLE
SET search_path = public, private, pg_temp
AS $$
  SELECT make_date(
    extract(year FROM p_month)::INTEGER,
    extract(month FROM p_month)::INTEGER,
    least(
      p_day,
      extract(day FROM (date_trunc('month', p_month) + interval '1 month - 1 day'))::INTEGER
    )
  );
$$;

CREATE OR REPLACE FUNCTION private.process_recurring_transactions(p_user_id UUID DEFAULT NULL)
RETURNS INTEGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET timezone TO 'Asia/Bangkok'
AS $$
DECLARE
  rule RECORD;
  inserted_count INTEGER := 0;
  rows_inserted INTEGER;
  current_due DATE;
BEGIN
  FOR rule IN
    SELECT *
    FROM public.recurring_transactions
    WHERE status = 'active'
      AND next_run_date <= CURRENT_DATE
      AND (p_user_id IS NULL OR user_id = p_user_id)
    ORDER BY next_run_date, id
    FOR UPDATE SKIP LOCKED
  LOOP
    current_due := rule.next_run_date;

    WHILE current_due <= CURRENT_DATE LOOP
      INSERT INTO public.transactions (
        user_id,
        type,
        amount,
        category_id,
        category,
        date,
        note,
        recurring_transaction_id,
        recurring_month,
        recurring_name
      ) VALUES (
        rule.user_id,
        rule.type,
        rule.amount,
        rule.category_id,
        rule.category,
        current_due,
        rule.note,
        rule.id,
        date_trunc('month', current_due)::date,
        rule.name
      )
      ON CONFLICT (recurring_transaction_id, recurring_month) DO NOTHING;

      GET DIAGNOSTICS rows_inserted = ROW_COUNT;
      inserted_count := inserted_count + rows_inserted;
      current_due := private.recurring_run_date((date_trunc('month', current_due) + interval '1 month')::date, rule.day_of_month);
    END LOOP;

    UPDATE public.recurring_transactions
    SET next_run_date = current_due,
        updated_at = now()
    WHERE id = rule.id;
  END LOOP;

  RETURN inserted_count;
END;
$$;

REVOKE ALL ON FUNCTION private.process_recurring_transactions(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.recurring_run_date(DATE, INTEGER) FROM PUBLIC, anon, authenticated;

-- This is the only client-callable entry point. The function derives the user
-- from the signed-in JWT and cannot be used to process another account.
CREATE OR REPLACE FUNCTION public.process_my_recurring_transactions()
RETURNS INTEGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET timezone TO 'Asia/Bangkok'
AS $$
DECLARE
  current_user_id UUID := auth.uid();
BEGIN
  IF current_user_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = current_user_id AND is_active
  ) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN private.process_recurring_transactions(current_user_id);
END;
$$;

REVOKE ALL ON FUNCTION public.process_my_recurring_transactions() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.process_my_recurring_transactions() TO authenticated;

-- Supabase Cron runs daily at 17:05 UTC (00:05 Asia/Bangkok). The
-- extension is managed by Supabase and can also be enabled in Dashboard →
-- Integrations → Cron when applying migrations to an existing project.
DO $job$
DECLARE
  existing_job_id BIGINT;
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
  EXCEPTION
    WHEN undefined_file OR insufficient_privilege OR active_sql_transaction THEN
      -- The table and client-side catch-up still work when this project does
      -- not allow extensions in migrations.
      RETURN;
  END;

  SELECT jobid INTO existing_job_id FROM cron.job WHERE jobname = 'cashflow-process-recurring';
  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;

  PERFORM cron.schedule(
    'cashflow-process-recurring',
    '5 17 * * *',
    $$SELECT private.process_recurring_transactions();$$
  );
  EXCEPTION
  WHEN undefined_table OR undefined_function OR insufficient_privilege THEN
    -- The schema and app remain usable when Cron is not enabled yet. The
    -- setup instructions in README explain how to enable it later.
    NULL;
END $job$;
