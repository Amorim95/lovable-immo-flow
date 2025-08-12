-- Criar função auxiliar para verificar se usuário é admin/gestor sem recursão
CREATE OR REPLACE FUNCTION public.user_role_check(_user_id uuid, _company_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users 
  WHERE id = _user_id 
  AND company_id = _company_id 
  AND status = 'ativo'
  LIMIT 1;
$$;

-- Remover políticas problemáticas da tabela users
DROP POLICY IF EXISTS "Usuarios podem ver usuarios da mesma empresa" ON public.users;
DROP POLICY IF EXISTS "Admins podem gerenciar usuarios da empresa" ON public.users;

-- Recriar políticas simples para users sem recursão
CREATE POLICY "Admin gestor pode ver usuarios da empresa"
ON public.users
FOR SELECT
USING (
  auth.uid() = '40257dfa-1a8e-4c15-a8f7-2cb99cfa4f08'::uuid OR 
  auth.uid() = '62926fc7-ffba-4a63-9bae-50f8845a1b67'::uuid OR
  (company_id IS NOT NULL AND 
   user_role_check(auth.uid(), company_id) IN ('admin', 'gestor')
  ) OR
  id = auth.uid()
);

CREATE POLICY "Admin pode gerenciar usuarios da empresa"
ON public.users
FOR ALL
USING (
  auth.uid() = '40257dfa-1a8e-4c15-a8f7-2cb99cfa4f08'::uuid OR 
  auth.uid() = '62926fc7-ffba-4a63-9bae-50f8845a1b67'::uuid OR
  (company_id IS NOT NULL AND 
   user_role_check(auth.uid(), company_id) = 'admin'
  )
);