-- Atualizar política de convites para incluir donos
DROP POLICY IF EXISTS "Admins podem gerenciar convites" ON public.invitations;

CREATE POLICY "Admins e donos podem gerenciar convites" 
ON public.invitations 
FOR ALL 
TO public
USING (EXISTS (
  SELECT 1 FROM public.users u 
  WHERE u.id = auth.uid() 
  AND u.status = 'ativo' 
  AND u.role IN ('admin', 'dono')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.users u 
  WHERE u.id = auth.uid() 
  AND u.status = 'ativo' 
  AND u.role IN ('admin', 'dono')
));

-- Atualizar política de tags para incluir donos
DROP POLICY IF EXISTS "Admins podem gerenciar tags" ON public.lead_tags;

CREATE POLICY "Admins e donos podem gerenciar tags" 
ON public.lead_tags 
FOR ALL 
TO public
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE id = auth.uid() 
  AND role IN ('admin', 'dono') 
  AND status = 'ativo'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.users 
  WHERE id = auth.uid() 
  AND role IN ('admin', 'dono') 
  AND status = 'ativo'
));

-- Atualizar política de permissões para incluir donos
DROP POLICY IF EXISTS "Admins podem ver todas as permissões" ON public.permissions;

CREATE POLICY "Admins e donos podem ver todas as permissões" 
ON public.permissions 
FOR SELECT 
TO public
USING (
  (user_id = auth.uid()) OR 
  (EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('admin', 'dono')
  ))
);

-- Atualizar função is_admin para incluir donos
CREATE OR REPLACE FUNCTION public.is_admin_or_owner(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = _user_id 
    AND role IN ('admin', 'dono') 
    AND status = 'ativo'
  );
END;
$$;

-- Manter função is_admin original mas criar uma versão ampliada
CREATE OR REPLACE FUNCTION public.is_admin_or_dono(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = _user_id 
    AND role IN ('admin', 'dono') 
    AND status = 'ativo'
  );
END;
$$;

-- Atualizar função can_view_all_leads para incluir donos
CREATE OR REPLACE FUNCTION public.can_view_all_leads(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.permissions p
    JOIN public.users u ON u.id = p.user_id
    WHERE p.user_id = _user_id 
    AND p.can_view_all_leads = true 
    AND u.status = 'ativo'
  ) OR public.is_admin_or_dono(_user_id);
END;
$$;

-- Atualizar função can_invite_users para incluir donos
CREATE OR REPLACE FUNCTION public.can_invite_users(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.permissions p
    JOIN public.users u ON u.id = p.user_id
    WHERE p.user_id = _user_id 
    AND p.can_invite_users = true 
    AND u.status = 'ativo'
  ) OR public.is_admin_or_dono(_user_id);
END;
$$;

-- Atualizar política de company_settings para incluir donos explicitamente
DROP POLICY IF EXISTS "Admins e gestores podem atualizar configuracoes da empresa" ON public.company_settings;

CREATE POLICY "Admins, donos e gestores podem atualizar configuracoes da empresa" 
ON public.company_settings 
FOR UPDATE 
TO public
USING (
  (company_id = get_user_company_id() AND 
   EXISTS (
     SELECT 1 FROM public.users u 
     WHERE u.id = auth.uid() 
     AND u.role IN ('admin', 'dono', 'gestor') 
     AND u.status = 'ativo' 
     AND u.company_id = get_user_company_id()
   )) OR 
  is_super_admin()
);

-- Atualizar política de inserção em company_settings para incluir donos
DROP POLICY IF EXISTS "Admins podem inserir configuracoes da empresa" ON public.company_settings;

CREATE POLICY "Admins e donos podem inserir configuracoes da empresa" 
ON public.company_settings 
FOR INSERT 
TO public
WITH CHECK (
  (company_id = get_user_company_id() AND 
   EXISTS (
     SELECT 1 FROM public.users 
     WHERE id = auth.uid() 
     AND role IN ('admin', 'dono') 
     AND status = 'ativo'
   )) OR 
  is_super_admin()
);

-- Comentário sobre outras políticas que já incluem 'dono' ou 'gestor':
-- - companies: já tem política específica para 'dono' e 'admin'
-- - equipes: já inclui 'admin' e 'gestor' 
-- - imoveis: já inclui 'admin' e 'gestor'
-- - leads: já inclui 'admin' e 'gestor'
-- - metas: já inclui 'admin' e 'gestor'