-- Corrigir políticas RLS para respeitar os flags de controle de acesso
-- Observação: "AS RESTRICTIVE" precisa estar após ON <tabela> e antes de FOR <comando>

-- 1) Imóveis: garantir que todo acesso (auth e anon) respeite imoveis_enabled e site_enabled (para público)
-- Remover políticas potencialmente existentes para evitar conflitos/duplicatas
DROP POLICY IF EXISTS "Imoveis habilitados (SELECT)" ON public.imoveis;
DROP POLICY IF EXISTS "Imoveis habilitados (INSERT)" ON public.imoveis;
DROP POLICY IF EXISTS "Imoveis habilitados (UPDATE)" ON public.imoveis;
DROP POLICY IF EXISTS "Imoveis habilitados (DELETE)" ON public.imoveis;
DROP POLICY IF EXISTS "Acesso público para imóveis (anon)" ON public.imoveis;

-- Políticas RESTRITIVAS para usuários autenticados (AND com políticas existentes)
CREATE POLICY "Imoveis habilitados (SELECT)"
ON public.imoveis
AS RESTRICTIVE
FOR SELECT
USING (
  is_super_admin() OR EXISTS (
    SELECT 1 FROM public.company_access_control cac
    WHERE cac.company_id = imoveis.company_id
      AND cac.imoveis_enabled = true
  )
);

CREATE POLICY "Imoveis habilitados (INSERT)"
ON public.imoveis
AS RESTRICTIVE
FOR INSERT
WITH CHECK (
  is_super_admin() OR EXISTS (
    SELECT 1 FROM public.company_access_control cac
    WHERE cac.company_id = imoveis.company_id
      AND cac.imoveis_enabled = true
  )
);

CREATE POLICY "Imoveis habilitados (UPDATE)"
ON public.imoveis
AS RESTRICTIVE
FOR UPDATE
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

CREATE POLICY "Imoveis habilitados (DELETE)"
ON public.imoveis
AS RESTRICTIVE
FOR DELETE
USING (
  is_super_admin() OR EXISTS (
    SELECT 1 FROM public.company_access_control cac
    WHERE cac.company_id = imoveis.company_id
      AND cac.imoveis_enabled = true
  )
);

-- Política PÚBLICA (anon) com a condição completa (substitui a anterior)
CREATE POLICY "Acesso público para imóveis (anon)"
ON public.imoveis
FOR SELECT
TO anon
USING (
  publico = true AND EXISTS (
    SELECT 1 FROM public.company_access_control cac
    WHERE cac.company_id = imoveis.company_id
      AND cac.site_enabled = true
      AND cac.imoveis_enabled = true
  )
);

-- 2) Configurações da empresa: leitura pública apenas quando o site estiver habilitado
DROP POLICY IF EXISTS "Leitura pública do site (anon)" ON public.company_settings;

CREATE POLICY "Leitura pública do site (anon)"
ON public.company_settings
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.company_access_control cac
    WHERE cac.company_id = company_settings.company_id
      AND cac.site_enabled = true
  )
);
