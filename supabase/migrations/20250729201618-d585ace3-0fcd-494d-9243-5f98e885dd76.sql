-- Desabilitar RLS temporariamente para limpar tudo
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Remover TODAS as políticas da tabela users
DROP POLICY IF EXISTS "Usuários ativos podem ver outros usuários da mesma equipe" ON public.users;
DROP POLICY IF EXISTS "Admins e gestores podem atualizar usuarios" ON public.users;
DROP POLICY IF EXISTS "admin_select_all" ON public.users;
DROP POLICY IF EXISTS "service_role_full_access" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.users;
DROP POLICY IF EXISTS "Usuários autenticados podem ver seu próprio perfil" ON public.users;
DROP POLICY IF EXISTS "Usuários podem atualizar seu perfil (exceto role)" ON public.users;
DROP POLICY IF EXISTS "Service role pode inserir usuários" ON public.users;
DROP POLICY IF EXISTS "Service role pode deletar usuários" ON public.users;
DROP POLICY IF EXISTS "Service role pode gerenciar auth users" ON public.users;

-- Reabilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Criar política básica para funcionar
CREATE POLICY "allow_users_select_own" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id);

-- Política simples para service role
CREATE POLICY "allow_service_role_all" 
ON public.users 
FOR ALL 
TO service_role
USING (true);

-- Política para INSERT (service role pode inserir)
CREATE POLICY "allow_insert" 
ON public.users 
FOR INSERT 
TO service_role
WITH CHECK (true);