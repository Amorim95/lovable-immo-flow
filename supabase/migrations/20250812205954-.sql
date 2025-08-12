-- Atualizar apenas as políticas de leads para corrigir permissões dos corretores
-- Remover políticas de leads existentes
DROP POLICY IF EXISTS "Usuarios podem ver leads da empresa" ON public.leads;
DROP POLICY IF EXISTS "Usuarios podem criar leads da empresa" ON public.leads;
DROP POLICY IF EXISTS "Corretores podem atualizar seus leads" ON public.leads;

-- Recriar com permissões corretas
-- Leads: ver todos da empresa, mas editar só os seus (exceto admin/gestor)
CREATE POLICY "Ver leads da empresa"
ON public.leads
FOR SELECT
USING (
  is_super_admin() OR
  company_id = get_user_company_id()
);

CREATE POLICY "Criar leads da empresa"
ON public.leads
FOR INSERT
WITH CHECK (company_id = get_user_company_id());

-- Corretores só podem editar seus próprios leads, admins/gestores editam todos
CREATE POLICY "Editar leads baseado no papel"
ON public.leads
FOR UPDATE
USING (
  is_super_admin() OR
  (company_id = get_user_company_id() AND 
   (user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'gestor') 
      AND status = 'ativo' 
      AND company_id = get_user_company_id()
    )
   )
  )
);