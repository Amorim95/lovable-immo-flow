-- Corrigir política RLS para lead_stages
DROP POLICY IF EXISTS "Admins podem gerenciar etapas da empresa" ON public.lead_stages;

CREATE POLICY "Admins podem gerenciar etapas da empresa" 
ON public.lead_stages 
FOR ALL 
USING (
  company_id = get_user_company_id() 
  AND (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE role = 'admin' 
      AND status = 'ativo' 
      AND company_id = get_user_company_id()
    )
    OR is_super_admin()
  )
)
WITH CHECK (
  company_id = get_user_company_id() 
  AND (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE role = 'admin' 
      AND status = 'ativo' 
      AND company_id = get_user_company_id()
    )
    OR is_super_admin()
  )
);