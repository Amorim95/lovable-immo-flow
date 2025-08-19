-- Restrictive policies to enforce company access control flags

-- Imoveis: authenticated users must have imoveis_enabled
CREATE POLICY IF NOT EXISTS "Imoveis habilitados (SELECT)" 
ON public.imoveis
FOR SELECT
AS RESTRICTIVE
USING (
  is_super_admin() OR EXISTS (
    SELECT 1 FROM public.company_access_control cac
    WHERE cac.company_id = imoveis.company_id
      AND cac.imoveis_enabled = true
  )
);

CREATE POLICY IF NOT EXISTS "Imoveis habilitados (INSERT)" 
ON public.imoveis
FOR INSERT
AS RESTRICTIVE
WITH CHECK (
  is_super_admin() OR EXISTS (
    SELECT 1 FROM public.company_access_control cac
    WHERE cac.company_id = imoveis.company_id
      AND cac.imoveis_enabled = true
  )
);

CREATE POLICY IF NOT EXISTS "Imoveis habilitados (UPDATE)" 
ON public.imoveis
FOR UPDATE
AS RESTRICTIVE
USING (
  is_super_admin() OR EXISTS (
    SELECT 1 FROM public.company_access_control cac
    WHERE cac.company_id = imoveis.company_id
      AND cac.imoveis_enabled = true
  )
)
WITH CHECK (
  is_super_admin() OR EXISTS (
    SELECT 1 FROM public.company_access_control cac
    WHERE cac.company_id = imoveis.company_id
      AND cac.imoveis_enabled = true
  )
);

CREATE POLICY IF NOT EXISTS "Imoveis habilitados (DELETE)" 
ON public.imoveis
FOR DELETE
AS RESTRICTIVE
USING (
  is_super_admin() OR EXISTS (
    SELECT 1 FROM public.company_access_control cac
    WHERE cac.company_id = imoveis.company_id
      AND cac.imoveis_enabled = true
  )
);

-- Imoveis: anon public access only when site and imoveis are enabled
CREATE POLICY IF NOT EXISTS "Acesso público quando habilitado (imoveis)" 
ON public.imoveis
FOR SELECT
TO anon
AS RESTRICTIVE
USING (
  publico = true AND EXISTS (
    SELECT 1 FROM public.company_access_control cac
    WHERE cac.company_id = imoveis.company_id
      AND cac.site_enabled = true
      AND cac.imoveis_enabled = true
  )
);

-- Company settings: anon read only when site enabled
CREATE POLICY IF NOT EXISTS "Leitura pública apenas com site habilitado" 
ON public.company_settings
FOR SELECT
TO anon
AS RESTRICTIVE
USING (
  EXISTS (
    SELECT 1 FROM public.company_access_control cac
    WHERE cac.company_id = company_settings.company_id
      AND cac.site_enabled = true
  )
);
