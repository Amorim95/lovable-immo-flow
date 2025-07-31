-- Corrigir políticas RLS para permitir que admins funcionem independente do status

-- Atualizar política para usuários (permitir admins independente do status)
DROP POLICY IF EXISTS "Admins e gestores podem atualizar qualquer usuário" ON public.users;
CREATE POLICY "Admins e gestores podem atualizar qualquer usuário" ON public.users
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND (
      (u.role = 'admin') OR 
      (u.role = 'gestor' AND u.status = 'ativo')
    )
  )
);

-- Atualizar política para equipes (permitir admins independente do status)
DROP POLICY IF EXISTS "Admins e gestores podem atualizar equipes" ON public.equipes;
CREATE POLICY "Admins e gestores podem atualizar equipes" ON public.equipes
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND (
      (u.role = 'admin') OR 
      (u.role = 'gestor' AND u.status = 'ativo')
    )
  )
);

DROP POLICY IF EXISTS "Admins e gestores podem criar equipes" ON public.equipes;
CREATE POLICY "Admins e gestores podem criar equipes" ON public.equipes
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND (
      (u.role = 'admin') OR 
      (u.role = 'gestor' AND u.status = 'ativo')
    )
  )
);

DROP POLICY IF EXISTS "Admins e gestores podem deletar equipes" ON public.equipes;
CREATE POLICY "Admins e gestores podem deletar equipes" ON public.equipes
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND (
      (u.role = 'admin') OR 
      (u.role = 'gestor' AND u.status = 'ativo')
    )
  )
);

-- Atualizar política para company_settings
DROP POLICY IF EXISTS "Admins e gestores podem atualizar configurações da empresa" ON public.company_settings;
CREATE POLICY "Admins e gestores podem atualizar configurações da empresa" ON public.company_settings
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND (
      (u.role = 'admin') OR 
      (u.role = 'gestor' AND u.status = 'ativo')
    )
  )
);

-- Atualizar política para permissions
DROP POLICY IF EXISTS "Admins podem ver todas as permissões" ON public.permissions;
CREATE POLICY "Admins podem ver todas as permissões" ON public.permissions
FOR SELECT 
USING (
  (user_id = auth.uid()) OR 
  (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  )
);