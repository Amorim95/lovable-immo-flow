-- Corrigir política de acesso público para mídias
DROP POLICY IF EXISTS "Acesso público para mídias (anon)" ON public.imovel_midias;

-- Criar política mais simples para mídias públicas
CREATE POLICY "Acesso público para mídias de imóveis públicos" 
ON public.imovel_midias 
FOR SELECT 
TO public
USING (
    EXISTS (
        SELECT 1 FROM public.imoveis 
        WHERE imoveis.id = imovel_midias.imovel_id 
        AND imoveis.publico = true
    )
);