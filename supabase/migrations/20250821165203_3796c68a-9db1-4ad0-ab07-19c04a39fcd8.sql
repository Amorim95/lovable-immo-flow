-- Ensure slug is automatically generated for properties and backfill existing records
-- 1) Create trigger to generate slug on insert when missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'imoveis_generate_slug_before_insert'
  ) THEN
    CREATE TRIGGER imoveis_generate_slug_before_insert
    BEFORE INSERT ON public.imoveis
    FOR EACH ROW
    WHEN (NEW.slug IS NULL OR NEW.slug = '')
    EXECUTE FUNCTION public.generate_imovel_slug();
  END IF;
END $$;

-- 2) Backfill slugs for existing rows that don't have one
UPDATE public.imoveis
SET slug = 'imovel-' || substring(id::text from 1 for 8)
WHERE (slug IS NULL OR slug = '');

-- 3) Create a unique index on slug to prevent duplicates (id-based slug ensures uniqueness)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'imoveis_slug_unique_idx'
  ) THEN
    CREATE UNIQUE INDEX imoveis_slug_unique_idx ON public.imoveis (slug);
  END IF;
END $$;