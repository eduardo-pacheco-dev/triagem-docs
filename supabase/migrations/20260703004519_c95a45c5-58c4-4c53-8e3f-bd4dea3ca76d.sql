
-- Add new columns
ALTER TABLE public.queue_entries
  ADD COLUMN IF NOT EXISTS site_id text,
  ADD COLUMN IF NOT EXISTS technician_name text,
  ADD COLUMN IF NOT EXISTS request_type text;

-- Backfill from existing legacy columns so old rows are usable
UPDATE public.queue_entries
SET site_id = COALESCE(site_id, identifier),
    technician_name = COALESCE(technician_name, full_name),
    request_type = COALESCE(request_type, 'Não especificado')
WHERE site_id IS NULL OR technician_name IS NULL OR request_type IS NULL;

ALTER TABLE public.queue_entries
  ALTER COLUMN site_id SET NOT NULL,
  ALTER COLUMN technician_name SET NOT NULL,
  ALTER COLUMN request_type SET NOT NULL;

CREATE INDEX IF NOT EXISTS queue_entries_site_id_idx ON public.queue_entries(site_id);

-- Request types catalog
CREATE TABLE IF NOT EXISTS public.request_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.request_types TO anon, authenticated;
GRANT ALL ON public.request_types TO service_role;

ALTER TABLE public.request_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read request_types" ON public.request_types FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public insert request_types" ON public.request_types FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public delete request_types" ON public.request_types FOR DELETE TO anon, authenticated USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.request_types;

INSERT INTO public.request_types (name) VALUES
  ('Instalação'),
  ('Manutenção Preventiva'),
  ('Auditoria')
ON CONFLICT (name) DO NOTHING;
