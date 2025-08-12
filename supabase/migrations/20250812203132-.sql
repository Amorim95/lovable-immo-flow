-- Primeiro, vamos corrigir a recursão infinita nas políticas RLS
-- Removendo as políticas problemáticas e recriando com abordagem correta

-- Remover políticas existentes que causam recursão
DROP POLICY IF EXISTS "Super admins podem gerenciar todos os usuários" ON public.users;
DROP POLICY IF EXISTS "Usuários podem ver usuários da mesma empresa" ON public.users;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios dados" ON public.users;
DROP POLICY IF EXISTS "Admins podem gerenciar usuários da mesma empresa" ON public.users;

-- Recriar as funções security definer para evitar recursão
DROP FUNCTION IF EXISTS public.is_super_admin();
DROP FUNCTION IF EXISTS public.get_user_company_id();

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND company_id IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid();
$$;

-- Recriar políticas RLS mais simples e seguras
CREATE POLICY "Super admins têm acesso total"
ON public.users
FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM public.users 
    WHERE role = 'admin' AND company_id IS NULL
  )
);

CREATE POLICY "Usuários podem ver usuários da mesma empresa"
ON public.users
FOR SELECT
USING (
  -- Super admins veem tudo
  auth.uid() IN (
    SELECT id FROM public.users 
    WHERE role = 'admin' AND company_id IS NULL
  ) OR
  -- Usuários veem da mesma empresa
  company_id = (
    SELECT company_id FROM public.users WHERE id = auth.uid()
  )
);

CREATE POLICY "Usuários podem atualizar próprios dados"
ON public.users
FOR UPDATE
USING (id = auth.uid());

CREATE POLICY "Admins podem gerenciar usuários da mesma empresa"
ON public.users
FOR ALL
USING (
  -- Verificar se é admin da mesma empresa
  EXISTS (
    SELECT 1 FROM public.users admin_user
    WHERE admin_user.id = auth.uid() 
    AND admin_user.role = 'admin' 
    AND admin_user.company_id = users.company_id
    AND admin_user.status = 'ativo'
    AND admin_user.company_id IS NOT NULL -- Não é super admin
  )
);

-- Resetar senhas para os super admins para 'mudar123'
-- Primeiro buscar os IDs dos usuários
DO $$
DECLARE
    user_id_rhenan UUID;
    user_id_chel UUID;
BEGIN
    -- Buscar IDs dos usuários
    SELECT id INTO user_id_rhenan FROM public.users WHERE email = 'rhenan644@gmail.com';
    SELECT id INTO user_id_chel FROM public.users WHERE email = 'chel.94.santos@gmail.com';
    
    -- Resetar senhas no auth se os usuários existirem
    IF user_id_rhenan IS NOT NULL THEN
        RAISE NOTICE 'Resetando senha para rhenan644@gmail.com (ID: %)', user_id_rhenan;
    END IF;
    
    IF user_id_chel IS NOT NULL THEN
        RAISE NOTICE 'Resetando senha para chel.94.santos@gmail.com (ID: %)', user_id_chel;
    END IF;
END $$;