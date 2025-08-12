-- Criar políticas específicas para diferentes tabelas e papéis

-- Políticas para equipes
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

-- Políticas para imoveis - corretores só podem gerenciar seus próprios
DROP POLICY IF EXISTS "Usuários podem gerenciar imóveis da mesma empresa" ON public.imoveis;

CREATE POLICY "Admins podem gerenciar todos imoveis da empresa"
ON public.imoveis
FOR ALL
USING (
  is_super_admin() OR
  (company_id = get_user_company_id() AND 
   auth.uid() IN (
     SELECT id FROM public.users 
     WHERE role = 'admin' AND status = 'ativo' AND company_id = get_user_company_id()
   ))
);

CREATE POLICY "Corretores podem gerenciar seus imoveis"
ON public.imoveis
FOR ALL
USING (
  is_super_admin() OR
  (company_id = get_user_company_id() AND user_id = auth.uid())
);

-- Políticas para metas - apenas admins e gestores
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