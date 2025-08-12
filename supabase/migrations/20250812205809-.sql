-- Adicionar políticas para usuários comuns da mesma empresa
-- Usuários podem ver outros usuários da mesma empresa
CREATE POLICY "Usuarios podem ver usuarios da mesma empresa"
ON public.users
FOR SELECT
USING (
  auth.uid() = '40257dfa-1a8e-4c15-a8f7-2cb99cfa4f08'::uuid OR 
  auth.uid() = '62926fc7-ffba-4a63-9bae-50f8845a1b67'::uuid OR
  company_id = get_user_company_id()
);

-- Admins podem gerenciar usuários da mesma empresa
CREATE POLICY "Admins podem gerenciar usuarios da empresa"
ON public.users
FOR ALL
USING (
  auth.uid() = '40257dfa-1a8e-4c15-a8f7-2cb99cfa4f08'::uuid OR 
  auth.uid() = '62926fc7-ffba-4a63-9bae-50f8845a1b67'::uuid OR
  (company_id = get_user_company_id() AND 
   auth.uid() IN (
     SELECT id FROM public.users 
     WHERE role = 'admin' AND status = 'ativo' AND company_id = get_user_company_id()
   ))
);

-- Recriar políticas para leads com base no papel do usuário
DROP POLICY IF EXISTS "Usuários podem ver leads da mesma empresa" ON public.leads;
DROP POLICY IF EXISTS "Usuários podem criar leads para sua empresa" ON public.leads;
DROP POLICY IF EXISTS "Usuários podem atualizar leads da mesma empresa" ON public.leads;

-- Leads: acesso baseado em papel e empresa
CREATE POLICY "Usuarios podem ver leads da empresa"
ON public.leads
FOR SELECT
USING (
  is_super_admin() OR
  company_id = get_user_company_id()
);

CREATE POLICY "Usuarios podem criar leads da empresa"
ON public.leads
FOR INSERT
WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Corretores podem atualizar seus leads"
ON public.leads
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