-- Recriar políticas da tabela companies
CREATE POLICY "Super admins podem gerenciar todas as empresas"
ON public.companies
FOR ALL
USING (is_super_admin());

CREATE POLICY "Usuarios podem ver sua propria empresa"
ON public.companies
FOR SELECT
USING (id = get_user_company_id());

-- Recriar políticas da tabela users
CREATE POLICY "Super admins podem gerenciar todos os usuarios"
ON public.users
FOR ALL
USING (is_super_admin());

CREATE POLICY "Admins podem gerenciar usuarios da mesma empresa"
ON public.users
FOR ALL
USING (
  NOT is_super_admin() AND
  company_id = get_user_company_id() AND
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'admin' AND u.status = 'ativo'
  )
);

-- Garantir que super-admins têm company_id NULL
UPDATE public.users 
SET company_id = NULL 
WHERE email IN ('rhenan644@gmail.com', 'chel.94.santos@gmail.com');