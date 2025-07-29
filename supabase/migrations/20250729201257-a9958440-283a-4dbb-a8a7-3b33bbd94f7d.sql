-- Remover políticas problemáticas que estão causando recursão infinita
DROP POLICY IF EXISTS "Usuários ativos podem ver outros usuários da mesma equipe" ON public.users;
DROP POLICY IF EXISTS "Admins e gestores podem atualizar usuarios" ON public.users;

-- Recriar políticas sem recursão
CREATE POLICY "Usuários podem ver seu próprio perfil" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Admins podem ver todos os usuários" 
ON public.users 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM auth.users au 
    JOIN public.users u ON u.id = au.id 
    WHERE au.id = auth.uid() 
    AND u.role = 'admin' 
    AND u.status = 'ativo'
  )
);

CREATE POLICY "Gestores podem ver usuários da mesma equipe" 
ON public.users 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM auth.users au 
    JOIN public.users gestor ON gestor.id = au.id 
    WHERE au.id = auth.uid() 
    AND gestor.role = 'gestor' 
    AND gestor.status = 'ativo'
    AND gestor.equipe_id = users.equipe_id
    AND gestor.equipe_id IS NOT NULL
  )
);

CREATE POLICY "Admins podem atualizar usuários" 
ON public.users 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM auth.users au 
    JOIN public.users admin ON admin.id = au.id 
    WHERE au.id = auth.uid() 
    AND admin.role = 'admin' 
    AND admin.status = 'ativo'
  )
);

CREATE POLICY "Gestores podem atualizar usuários da mesma equipe" 
ON public.users 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM auth.users au 
    JOIN public.users gestor ON gestor.id = au.id 
    WHERE au.id = auth.uid() 
    AND gestor.role = 'gestor' 
    AND gestor.status = 'ativo'
    AND gestor.equipe_id = users.equipe_id
    AND gestor.equipe_id IS NOT NULL
  )
);