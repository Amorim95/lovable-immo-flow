-- Permitir que admins/gestores vejam todos os leads independentemente do próprio status
-- Apenas verificar se o papel é admin/gestor, não o status

DROP POLICY IF EXISTS "Ver leads baseado no papel do usuario" ON public.leads;

CREATE POLICY "Ver leads baseado no papel do usuario" 
ON public.leads 
FOR SELECT 
USING (
  is_super_admin() OR 
  (
    company_id = get_user_company_id() AND 
    (
      -- Usuários podem sempre ver seus próprios leads, independente do status
      user_id = auth.uid() OR
      -- Admins/gestores podem ver todos os leads da empresa (sem verificar status)
      (
        EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = auth.uid() 
          AND users.role = ANY (ARRAY['admin'::user_role, 'gestor'::user_role]) 
          AND users.company_id = get_user_company_id()
        )
      )
    )
  )
);