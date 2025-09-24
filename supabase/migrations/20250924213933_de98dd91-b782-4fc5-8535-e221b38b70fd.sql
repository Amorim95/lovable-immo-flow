-- Remover a política atual de acesso público
DROP POLICY IF EXISTS "Acesso público para imóveis (anon)" ON public.imoveis;

-- Criar nova política que permite acesso direto a imóveis públicos
CREATE POLICY "Acesso público para imóveis públicos" 
ON public.imoveis 
FOR SELECT 
TO public
USING (publico = true);