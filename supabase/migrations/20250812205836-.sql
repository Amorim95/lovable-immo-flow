-- Adicionar políticas para outras tabelas importantes

-- Políticas para equipes - apenas admins/gestores podem gerenciar
DROP POLICY IF EXISTS "Admins e gestores podem gerenciar equipes da mesma empresa" ON public.equipes;
DROP POLICY IF EXISTS "Usuários podem ver equipes da mesma empresa" ON public.equipes;

CREATE POLICY "Admins e gestores podem gerenciar equipes"
ON public.equipes
FOR ALL
USING (
  is_super_admin() OR
  (company_id = get_user_company_id() AND 
   auth.uid() IN (
     SELECT id FROM public.users 
     WHERE role IN ('admin', 'gestor') AND status = 'ativo' AND company_id = get_user_company_id()
   ))
);

CREATE POLICY "Usuarios podem ver equipes da empresa"
ON public.equipes
FOR SELECT
USING (
  is_super_admin() OR
  company_id = get_user_company_id()
);

-- Políticas para metas - apenas admins/gestores podem gerenciar
DROP POLICY IF EXISTS "Admins e gestores podem gerenciar metas da mesma empresa" ON public.metas;
DROP POLICY IF EXISTS "Usuários podem ver metas da mesma empresa" ON public.metas;

CREATE POLICY "Admins e gestores podem gerenciar metas"
ON public.metas
FOR ALL
USING (
  is_super_admin() OR
  (company_id = get_user_company_id() AND 
   auth.uid() IN (
     SELECT id FROM public.users 
     WHERE role IN ('admin', 'gestor') AND status = 'ativo' AND company_id = get_user_company_id()
   ))
);

CREATE POLICY "Usuarios podem ver metas da empresa"
ON public.metas
FOR SELECT
USING (
  is_super_admin() OR
  company_id = get_user_company_id()
);

-- Políticas para imoveis - corretores podem ver todos da empresa mas só editar os seus
DROP POLICY IF EXISTS "Usuários podem gerenciar imóveis da mesma empresa" ON public.imoveis;

CREATE POLICY "Usuarios podem ver imoveis da empresa"
ON public.imoveis
FOR SELECT
USING (
  is_super_admin() OR
  company_id = get_user_company_id()
);

CREATE POLICY "Usuarios podem criar imoveis da empresa"
ON public.imoveis
FOR INSERT
WITH CHECK (
  is_super_admin() OR
  company_id = get_user_company_id()
);

CREATE POLICY "Corretores podem editar seus imoveis"
ON public.imoveis
FOR UPDATE
USING (
  is_super_admin() OR
  (company_id = get_user_company_id() AND 
   (user_id = auth.uid() OR 
    auth.uid() IN (
      SELECT id FROM public.users 
      WHERE role IN ('admin', 'gestor') AND status = 'ativo' AND company_id = get_user_company_id()
    )
   )
  )
);

CREATE POLICY "Admins podem deletar imoveis da empresa"
ON public.imoveis
FOR DELETE
USING (
  is_super_admin() OR
  (company_id = get_user_company_id() AND 
   auth.uid() IN (
     SELECT id FROM public.users 
     WHERE role = 'admin' AND status = 'ativo' AND company_id = get_user_company_id()
   ))
);