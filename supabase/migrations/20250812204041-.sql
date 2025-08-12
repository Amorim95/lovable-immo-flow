-- Simplificar completamente as políticas RLS para super admins
-- Remover todas as políticas da tabela users
DROP POLICY IF EXISTS "Super admins acesso completo" ON public.users;
DROP POLICY IF EXISTS "Usuarios mesma empresa" ON public.users;
DROP POLICY IF EXISTS "Usuarios podem atualizar proprios dados" ON public.users;
DROP POLICY IF EXISTS "Admins empresa podem gerenciar" ON public.users;

-- Criar políticas ultra-simples sem recursão
-- Super admin tem acesso total usando ID direto
CREATE POLICY "Super admin chel acesso total"
ON public.users
FOR ALL
USING (auth.uid() = '40257dfa-1a8e-4c15-a8f7-2cb99cfa4f08'::uuid);

-- Super admin rhenan tem acesso total usando email
CREATE POLICY "Super admin rhenan acesso total"  
ON public.users
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'rhenan644@gmail.com'
  )
);

-- Usuários podem ver dados da mesma empresa
CREATE POLICY "Usuarios ver mesma empresa"
ON public.users
FOR SELECT
USING (
  -- Super admins veem tudo
  auth.uid() = '40257dfa-1a8e-4c15-a8f7-2cb99cfa4f08'::uuid OR
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'rhenan644@gmail.com'
  ) OR
  -- Usuários normais veem da mesma empresa
  company_id = (
    SELECT u.company_id FROM public.users u WHERE u.id = auth.uid()
  )
);

-- Usuários podem atualizar próprios dados
CREATE POLICY "Update proprio perfil"
ON public.users  
FOR UPDATE
USING (
  -- Super admins podem atualizar qualquer um
  auth.uid() = '40257dfa-1a8e-4c15-a8f7-2cb99cfa4f08'::uuid OR
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'rhenan644@gmail.com'
  ) OR
  -- Usuário próprio
  id = auth.uid()
);

-- Confirmar que o usuário chel é super admin
UPDATE public.users 
SET role = 'admin', company_id = NULL, status = 'ativo'
WHERE email = 'chel.94.santos@gmail.com';