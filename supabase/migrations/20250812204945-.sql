-- Atualizar políticas da tabela companies
-- Permitir que super-admins vejam e gerenciem todas as empresas
CREATE POLICY "Super admins podem gerenciar todas as empresas"
ON public.companies
FOR ALL
USING (is_super_admin());

-- Permitir que admins normais vejam apenas sua própria empresa
CREATE POLICY "Usuarios podem ver sua propria empresa"
ON public.companies
FOR SELECT
USING (id = get_user_company_id());

-- Garantir que super-admins têm company_id NULL
UPDATE public.users 
SET company_id = NULL 
WHERE email IN ('rhenan644@gmail.com', 'chel.94.santos@gmail.com');