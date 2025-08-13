-- Corrigir política RLS para permitir que usuários vejam seus próprios leads independentemente do status
-- Apenas verificar status 'ativo' para roles administrativos

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
      -- Apenas admins/gestores ATIVOS podem ver todos os leads
      (
        EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = auth.uid() 
          AND users.role = ANY (ARRAY['admin'::user_role, 'gestor'::user_role]) 
          AND users.status = 'ativo'::user_status 
          AND users.company_id = get_user_company_id()
        )
      )
    )
  )
);