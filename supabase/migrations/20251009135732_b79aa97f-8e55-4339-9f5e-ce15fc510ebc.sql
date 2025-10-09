-- Remover verificação de status das políticas RLS
-- Usuários inativos podem acessar o sistema, mas não recebem leads

-- 1. Atualizar política de visualização de usuários
DROP POLICY IF EXISTS "Usuarios mesma empresa podem se ver" ON users;
CREATE POLICY "Usuarios mesma empresa podem se ver" ON users
FOR SELECT
USING (
  auth.uid() = '40257dfa-1a8e-4c15-a8f7-2cb99cfa4f08'::uuid OR 
  auth.uid() = '62926fc7-ffba-4a63-9bae-50f8845a1b67'::uuid OR
  id = auth.uid() OR 
  company_id = get_current_user_company_id()
);

-- 2. Atualizar política de atualização de usuários (remover verificação de status)
DROP POLICY IF EXISTS "Admins e gestores podem alterar status de usuarios" ON users;
CREATE POLICY "Admins e gestores podem alterar status de usuarios" ON users
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('admin', 'gestor', 'dono')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('admin', 'gestor', 'dono')
  )
);

-- 3. Atualizar políticas de equipes (remover status)
DROP POLICY IF EXISTS "Admins e gestores podem gerenciar equipes" ON equipes;
CREATE POLICY "Admins e gestores podem gerenciar equipes" ON equipes
FOR ALL
USING (
  is_super_admin() OR (
    company_id = get_user_company_id() AND
    auth.uid() IN (
      SELECT id FROM users 
      WHERE role IN ('admin', 'gestor') 
      AND company_id = get_user_company_id()
    )
  )
);

-- 4. Atualizar políticas de metas (remover status)
DROP POLICY IF EXISTS "Admins e gestores podem gerenciar metas" ON metas;
CREATE POLICY "Admins e gestores podem gerenciar metas" ON metas
FOR ALL
USING (
  is_super_admin() OR (
    company_id = get_user_company_id() AND
    auth.uid() IN (
      SELECT id FROM users 
      WHERE role IN ('admin', 'gestor') 
      AND company_id = get_user_company_id()
    )
  )
);

-- 5. Atualizar políticas de company_settings (remover status)
DROP POLICY IF EXISTS "Admins, donos e gestores podem atualizar configuracoes da empre" ON company_settings;
CREATE POLICY "Admins, donos e gestores podem atualizar configuracoes da empre" ON company_settings
FOR UPDATE
USING (
  is_super_admin() OR (
    company_id = get_user_company_id() AND
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'dono', 'gestor')
      AND u.company_id = get_user_company_id()
    )
  )
);

DROP POLICY IF EXISTS "Admins e donos podem inserir configuracoes da empresa" ON company_settings;
CREATE POLICY "Admins e donos podem inserir configuracoes da empresa" ON company_settings
FOR INSERT
WITH CHECK (
  is_super_admin() OR (
    company_id = get_user_company_id() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'dono')
    )
  )
);

-- 6. Atualizar políticas de invitations (remover status)
DROP POLICY IF EXISTS "Admins e donos podem gerenciar convites" ON invitations;
CREATE POLICY "Admins e donos podem gerenciar convites" ON invitations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('admin', 'dono')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('admin', 'dono')
  )
);

-- 7. Atualizar políticas de companies (remover status)
DROP POLICY IF EXISTS "Donos e admins podem atualizar sua empresa" ON companies;
CREATE POLICY "Donos e admins podem atualizar sua empresa" ON companies
FOR UPDATE
USING (
  id = get_user_company_id() AND
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.company_id = companies.id 
    AND u.role IN ('dono', 'admin')
  )
);

-- 8. Atualizar políticas de imoveis (remover status)
DROP POLICY IF EXISTS "Admins podem deletar imoveis da empresa" ON imoveis;
CREATE POLICY "Admins podem deletar imoveis da empresa" ON imoveis
FOR DELETE
USING (
  is_super_admin() OR (
    company_id = get_user_company_id() AND
    auth.uid() IN (
      SELECT id FROM users 
      WHERE role = 'admin' 
      AND company_id = get_user_company_id()
    )
  )
);

DROP POLICY IF EXISTS "Corretores podem editar seus imoveis" ON imoveis;
CREATE POLICY "Corretores podem editar seus imoveis" ON imoveis
FOR UPDATE
USING (
  is_super_admin() OR (
    company_id = get_user_company_id() AND (
      user_id = auth.uid() OR
      auth.uid() IN (
        SELECT id FROM users 
        WHERE role IN ('admin', 'gestor') 
        AND company_id = get_user_company_id()
      )
    )
  )
);

-- 9. Atualizar políticas de leads (remover status)
DROP POLICY IF EXISTS "Ver leads baseado no papel do usuario" ON leads;
CREATE POLICY "Ver leads baseado no papel do usuario" ON leads
FOR SELECT
USING (
  is_super_admin() OR (
    company_id = get_user_company_id() AND (
      user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'gestor')
        AND company_id = get_user_company_id()
      )
    )
  )
);

DROP POLICY IF EXISTS "Editar leads baseado no papel" ON leads;
CREATE POLICY "Editar leads baseado no papel" ON leads
FOR UPDATE
USING (
  is_super_admin() OR (
    company_id = get_user_company_id() AND (
      user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'gestor')
        AND company_id = get_user_company_id()
      )
    )
  )
);

-- 10. Atualizar funções auxiliares (remover verificações de status)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = _user_id AND role = 'admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_dono(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = _user_id 
    AND role IN ('admin', 'dono')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.can_view_all_leads(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.permissions p
    JOIN public.users u ON u.id = p.user_id
    WHERE p.user_id = _user_id 
    AND p.can_view_all_leads = true
  ) OR public.is_admin_or_dono(_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.can_invite_users(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.permissions p
    JOIN public.users u ON u.id = p.user_id
    WHERE p.user_id = _user_id 
    AND p.can_invite_users = true
  ) OR public.is_admin_or_dono(_user_id);
END;
$$;