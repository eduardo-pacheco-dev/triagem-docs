
CREATE TABLE public.queue_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol text NOT NULL UNIQUE,
  full_name text NOT NULL,
  identifier text NOT NULL,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','in_review','approved','rejected')),
  position_seq bigserial,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.queue_entries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.queue_entries TO authenticated;
GRANT ALL ON public.queue_entries TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.queue_entries_position_seq_seq TO anon, authenticated, service_role;

ALTER TABLE public.queue_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read queue" ON public.queue_entries FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public insert queue" ON public.queue_entries FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public update queue" ON public.queue_entries FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER queue_entries_updated_at BEFORE UPDATE ON public.queue_entries
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_entries;
ALTER TABLE public.queue_entries REPLICA IDENTITY FULL;
