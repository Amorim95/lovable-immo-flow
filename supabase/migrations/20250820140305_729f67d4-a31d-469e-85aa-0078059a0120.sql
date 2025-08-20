-- Permitir transferência de leads independente do status do usuário
-- Removendo a restrição de status 'ativo' das políticas de leads

-- Atualizar política de edição de leads para remover restrição de status
DROP POLICY IF EXISTS "Editar leads baseado no papel" ON public.leads;
CREATE POLICY "Editar leads baseado no papel" 
ON public.leads FOR UPDATE
USING (
  is_super_admin() OR 
  (
    company_id = get_user_company_id() AND 
    (
      user_id = auth.uid() OR 
      (EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'gestor') 
        AND company_id = get_user_company_id()
      ))
    )
  )
);

-- Atualizar política de visualização de leads para remover restrição de status
DROP POLICY IF EXISTS "Ver leads baseado no papel do usuario" ON public.leads;
CREATE POLICY "Ver leads baseado no papel do usuario" 
ON public.leads FOR SELECT
USING (
  is_super_admin() OR 
  (
    company_id = get_user_company_id() AND 
    (
      user_id = auth.uid() OR 
      (EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'gestor') 
        AND company_id = get_user_company_id()
      ))
    )
  )
);