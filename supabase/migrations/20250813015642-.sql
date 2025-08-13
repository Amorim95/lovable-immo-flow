-- Tighten RLS to avoid cross-company data leakage while keeping public site working
-- 1) IMOVEIS: remove overly permissive public policy and re-create for anon only and only public listings
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'imoveis' AND policyname = 'Acesso público para todos os imóveis'
  ) THEN
    DROP POLICY "Acesso público para todos os imóveis" ON public.imoveis;
  END IF;
END $$;

CREATE POLICY "Acesso público para imóveis (anon)"
ON public.imoveis
FOR SELECT
TO anon
USING (publico = true);

-- Keep authenticated users restricted by existing company policy (already present)

-- 2) IMOVEL_MIDIAS: restrict public to medias of public listings only, anon only
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'imovel_midias' AND policyname = 'Acesso público para todas as mídias de imóveis'
  ) THEN
    DROP POLICY "Acesso público para todas as mídias de imóveis" ON public.imovel_midias;
  END IF;
END $$;

CREATE POLICY "Acesso público para mídias (anon)"
ON public.imovel_midias
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.imoveis i
    WHERE i.id = imovel_midias.imovel_id
      AND i.publico = true
  )
);

-- 3) COMPANY_SETTINGS: keep public read for anon only so authenticated users rely on company-specific policies
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'company_settings' AND policyname = 'Acesso publico para leitura do site'
  ) THEN
    DROP POLICY "Acesso publico para leitura do site" ON public.company_settings;
  END IF;
END $$;

CREATE POLICY "Leitura pública do site (anon)"
ON public.company_settings
FOR SELECT
TO anon
USING (true);
