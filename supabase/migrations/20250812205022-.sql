-- Remover políticas existentes das tabelas companies e users para recriar corretamente
DROP POLICY IF EXISTS "Super admins podem gerenciar todas as empresas" ON public.companies;
DROP POLICY IF EXISTS "Usuários podem ver sua própria empresa" ON public.companies;
DROP POLICY IF EXISTS "Usuarios podem ver sua propria empresa" ON public.companies;
DROP POLICY IF EXISTS "Super admins podem gerenciar todos os usuários" ON public.users;
DROP POLICY IF EXISTS "Admins podem gerenciar usuarios da mesma empresa" ON public.users;