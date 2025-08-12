-- Ajustar políticas RLS para que corretores vejam apenas seus próprios leads
-- Recriar a política de visualização de leads com restrições por papel

-- Remover a política atual de visualização
DROP POLICY IF EXISTS "Ver leads da empresa" ON public.leads;

-- Criar nova política mais específica
CREATE POLICY "Ver leads baseado no papel do usuario"
ON public.leads
FOR SELECT
USING (
  -- Super-admins podem ver todos os leads
  is_super_admin() OR
  -- Usuários da mesma empresa com diferentes permissões
  (company_id = get_user_company_id() AND (
    -- Admins e gestores podem ver todos os leads da empresa
    (EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'gestor') 
      AND status = 'ativo'
      AND company_id = get_user_company_id()
    )) OR
    -- Corretores só podem ver seus próprios leads
    (user_id = auth.uid())
  ))
);