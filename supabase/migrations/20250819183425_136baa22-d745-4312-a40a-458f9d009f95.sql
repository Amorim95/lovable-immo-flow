-- Criar função SECURITY DEFINER para verificar se imóvel é público e acessível
CREATE OR REPLACE FUNCTION public.is_imovel_publicly_accessible(imovel_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verifica se o imóvel existe, é público e a empresa tem acesso habilitado
  RETURN EXISTS (
    SELECT 1 
    FROM imoveis i
    LEFT JOIN company_access_control cac ON cac.company_id = i.company_id
    WHERE i.id = imovel_id_param 
    AND i.publico = true
    AND (cac.site_enabled = true AND cac.imoveis_enabled = true)
  );
END;
$$;

-- Atualizar política RLS para mídias públicas usando a função SECURITY DEFINER
DROP POLICY IF EXISTS "Acesso público para mídias (anon)" ON public.imovel_midias;

CREATE POLICY "Acesso público para mídias (anon)" 
ON public.imovel_midias FOR SELECT
USING (public.is_imovel_publicly_accessible(imovel_id));