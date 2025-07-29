-- Remover TODAS as políticas da tabela users
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.users;
DROP POLICY IF EXISTS "Usuários autenticados podem ver seu próprio perfil" ON public.users;
DROP POLICY IF EXISTS "Usuários podem atualizar seu perfil (exceto role)" ON public.users;
DROP POLICY IF EXISTS "Service role pode inserir usuários" ON public.users;
DROP POLICY IF EXISTS "Service role pode deletar usuários" ON public.users;
DROP POLICY IF EXISTS "Service role pode gerenciar auth users" ON public.users;

-- Criar políticas simples e sem recursão
CREATE POLICY "users_select_own" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "users_update_own" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id);

-- Política para service role (permite inserir/deletar/gerenciar)
CREATE POLICY "service_role_full_access" 
ON public.users 
FOR ALL 
USING (true);

-- Política para admins verem todos os usuários
CREATE POLICY "admin_select_all" 
ON public.users 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.users admin_user 
    WHERE admin_user.id = auth.uid() 
    AND admin_user.role = 'admin'::user_role 
    AND admin_user.status = 'ativo'::user_status
  )
);