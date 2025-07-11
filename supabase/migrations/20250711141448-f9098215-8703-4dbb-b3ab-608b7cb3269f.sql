-- Criar políticas temporárias para permitir acesso sem autenticação (apenas para desenvolvimento)

-- Política para permitir SELECT em users sem autenticação
DROP POLICY IF EXISTS "Public access to users" ON public.users;
CREATE POLICY "Public access to users" 
ON public.users 
FOR SELECT 
USING (true);

-- Política para permitir SELECT em equipes sem autenticação  
DROP POLICY IF EXISTS "Public access to equipes" ON public.equipes;
CREATE POLICY "Public access to equipes" 
ON public.equipes 
FOR SELECT 
USING (true);

-- Política para permitir SELECT em permissions sem autenticação
DROP POLICY IF EXISTS "Public access to permissions" ON public.permissions;
CREATE POLICY "Public access to permissions" 
ON public.permissions 
FOR SELECT 
USING (true);