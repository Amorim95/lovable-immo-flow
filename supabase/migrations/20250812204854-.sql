-- Atualizar função is_super_admin para verificar apenas os emails específicos
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND email IN ('rhenan644@gmail.com', 'chel.94.santos@gmail.com')
  );
$function$

-- Atualizar políticas da tabela companies para distinguir super-admin de admin normal
DROP POLICY IF EXISTS "Super admins podem gerenciar todas as empresas" ON public.companies;
DROP POLICY IF EXISTS "Usuários podem ver sua própria empresa" ON public.companies;

CREATE POLICY "Super admins podem gerenciar todas as empresas"
ON public.companies
FOR ALL
USING (is_super_admin());

CREATE POLICY "Admins podem gerenciar apenas sua empresa"
ON public.companies
FOR ALL
USING (
  NOT is_super_admin() AND 
  id = get_user_company_id() AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin' AND status = 'ativo'
  )
);

CREATE POLICY "Usuários podem ver sua própria empresa"
ON public.companies
FOR SELECT
USING (id = get_user_company_id());

-- Atualizar políticas da tabela users para super-admins
DROP POLICY IF EXISTS "Super admins podem gerenciar todos os usuários" ON public.users;

CREATE POLICY "Super admins podem gerenciar todos os usuários"
ON public.users
FOR ALL
USING (is_super_admin());

-- Política para admins normais gerenciarem apenas usuários da mesma empresa
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