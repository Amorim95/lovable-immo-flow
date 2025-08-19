-- Atualizar função para permitir fallback quando não existir registro em company_access_control
CREATE OR REPLACE FUNCTION public.is_imovel_publicly_accessible(imovel_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM imoveis i
    LEFT JOIN company_access_control cac ON cac.company_id = i.company_id
    WHERE i.id = imovel_id_param 
      AND i.publico = true
      AND COALESCE(cac.site_enabled, true)
      AND COALESCE(cac.imoveis_enabled, true)
  );
END;
$$;

-- Atualizar política pública de imoveis para usar a função (com fallback)
DROP POLICY IF EXISTS "Acesso público para imóveis (anon)" ON public.imoveis;

CREATE POLICY "Acesso público para imóveis (anon)" 
ON public.imoveis FOR SELECT
USING (public.is_imovel_publicly_accessible(id));