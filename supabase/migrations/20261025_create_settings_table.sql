CREATE TABLE IF NOT EXISTS public.settings (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key         TEXT NOT NULL UNIQUE,
    value       JSONB NOT NULL DEFAULT '{}'::jsonb
                CHECK (jsonb_typeof(value) = 'object'),
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.settings_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.settings_set_updated_at() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_settings_updated_at ON public.settings;
CREATE TRIGGER trg_settings_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW EXECUTE FUNCTION public.settings_set_updated_at();

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read non-private settings" ON public.settings;
CREATE POLICY "Public can read non-private settings"
    ON public.settings FOR SELECT
    TO anon, authenticated
    USING (key NOT LIKE 'secret\_%' AND key NOT LIKE 'private\_%');

NOTIFY pgrst, 'reload schema';