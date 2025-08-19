-- Tornar visibilidade pública dos imóveis independente do controle de acesso
CREATE OR REPLACE FUNCTION public.is_imovel_publicly_accessible(imovel_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Se o imóvel é público, qualquer visitante pode ver
  RETURN EXISTS (
    SELECT 1 FROM imoveis i
    WHERE i.id = imovel_id_param
      AND i.publico = true
  );
END;
$$;

-- Recriar políticas para garantir uso da função simplificada
DROP POLICY IF EXISTS "Acesso público para imóveis (anon)" ON public.imoveis;
CREATE POLICY "Acesso público para imóveis (anon)"
ON public.imoveis FOR SELECT
USING (public.is_imovel_publicly_accessible(id));

DROP POLICY IF EXISTS "Acesso público para mídias (anon)" ON public.imovel_midias;
CREATE POLICY "Acesso público para mídias (anon)"
ON public.imovel_midias FOR SELECT
USING (public.is_imovel_publicly_accessible(imovel_id));