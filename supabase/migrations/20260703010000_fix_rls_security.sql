-- =============================================================
-- Security fix: Restrict anon role permissions and RLS policies
-- =============================================================

-- 1. Revoke excessive permissions from anon role
REVOKE ALL ON public.queue_entries FROM anon;
REVOKE ALL ON public.request_types FROM anon;
REVOKE ALL ON SEQUENCE public.queue_entries_position_seq_seq FROM anon;

-- 2. Grant only what's needed for public operations
--    anon can INSERT (check-in) and SELECT (status tracking) on queue_entries
--    anon can SELECT (combo box) on request_types
GRANT SELECT, INSERT ON public.queue_entries TO anon;
GRANT SELECT ON public.request_types TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.queue_entries_position_seq_seq TO anon;

-- 3. Authenticated role (admin via service-role / Supabase Auth)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.queue_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.request_types TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.queue_entries_position_seq_seq TO authenticated;

-- 4. Drop overly permissive RLS policies
DROP POLICY IF EXISTS "public update queue" ON public.queue_entries;
DROP POLICY IF EXISTS "public insert queue" ON public.queue_entries;
DROP POLICY IF EXISTS "public read queue" ON public.queue_entries;
DROP POLICY IF EXISTS "public insert request_types" ON public.request_types;
DROP POLICY IF EXISTS "public delete request_types" ON public.request_types;
DROP POLICY IF EXISTS "public read request_types" ON public.request_types;

-- 5. Create restricted RLS policies for queue_entries
CREATE POLICY "anon_insert_queue" ON public.queue_entries
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "anon_select_queue" ON public.queue_entries
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "auth_all_queue" ON public.queue_entries
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. Create restricted RLS policies for request_types
CREATE POLICY "anon_select_request_types" ON public.request_types
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "auth_all_request_types" ON public.request_types
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 7. Ensure replica identity and publication are preserved
ALTER TABLE public.queue_entries REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime SET TABLE public.queue_entries, public.request_types;
