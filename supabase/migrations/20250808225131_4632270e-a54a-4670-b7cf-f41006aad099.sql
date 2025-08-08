-- Atualizar política RLS para permitir acesso público a todos os imóveis
DROP POLICY IF EXISTS "Acesso público para imóveis públicos" ON public.imoveis;

-- Criar nova política que permite acesso público a todos os imóveis
CREATE POLICY "Acesso público para todos os imóveis" 
ON public.imoveis 
FOR SELECT 
USING (true);

-- Atualizar política para mídias também permitir acesso a todas as mídias de imóveis
DROP POLICY IF EXISTS "Acesso público para mídias de imóveis públicos" ON public.imovel_midias;

-- Criar nova política que permite acesso público a todas as mídias
CREATE POLICY "Acesso público para todas as mídias de imóveis" 
ON public.imovel_midias 
FOR SELECT 
USING (true);