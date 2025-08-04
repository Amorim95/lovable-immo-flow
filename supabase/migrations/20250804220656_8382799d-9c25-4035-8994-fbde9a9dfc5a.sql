-- Ajustar políticas RLS para permitir admins alterarem dados da empresa independente do status

-- Remover política de UPDATE existente
DROP POLICY IF EXISTS "Admins e gestores podem atualizar configurações da empresa" ON public.company_settings;

-- Criar nova política de UPDATE permitindo admins independente do status
CREATE POLICY "Admins e gestores podem atualizar configurações da empresa" 
ON public.company_settings 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() 
    AND (
      u.role = 'admin'::user_role 
      OR (u.role = 'gestor'::user_role AND u.status = 'ativo'::user_status)
    )
  )
);

-- Remover política de INSERT existente
DROP POLICY IF EXISTS "Admins podem inserir configurações da empresa" ON public.company_settings;

-- Criar nova política de INSERT permitindo admins independente do status
CREATE POLICY "Admins podem inserir configurações da empresa" 
ON public.company_settings 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'::user_role
  )
);