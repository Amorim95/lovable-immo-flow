-- Corrigir política RLS para que admins e gestores ativos vejam todos os leads da empresa
DROP POLICY IF EXISTS "Ver leads baseado no papel do usuario" ON public.leads;

CREATE POLICY "Ver leads baseado no papel do usuario"
ON public.leads
FOR SELECT
USING (
  is_super_admin() OR 
  (
    company_id = get_user_company_id() AND 
    (
      user_id = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'gestor') 
        AND users.status = 'ativo'
        AND users.company_id = get_user_company_id()
      )
    )
  )
);