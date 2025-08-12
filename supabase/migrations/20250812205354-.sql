-- Remover TODAS as políticas da tabela users para corrigir recursão infinita
DROP POLICY IF EXISTS "Chel super admin completo" ON public.users;
DROP POLICY IF EXISTS "Rhenan super admin completo" ON public.users;
DROP POLICY IF EXISTS "Ver proprio perfil" ON public.users;
DROP POLICY IF EXISTS "Atualizar proprio perfil" ON public.users;
DROP POLICY IF EXISTS "Permitir inserção" ON public.users;
DROP POLICY IF EXISTS "Super admins podem gerenciar todos os usuarios" ON public.users;
DROP POLICY IF EXISTS "Admins podem gerenciar usuarios da mesma empresa" ON public.users;
DROP POLICY IF EXISTS "allow_insert" ON public.users;
DROP POLICY IF EXISTS "allow_service_role_all" ON public.users;
DROP POLICY IF EXISTS "Service role pode gerenciar auth users" ON public.users;