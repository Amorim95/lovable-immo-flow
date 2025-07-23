-- Permitir que admins e gestores transfiram leads independente do status
-- Atualizar política de UPDATE para leads

DROP POLICY IF EXISTS "Usuários podem atualizar leads conforme permissões" ON public.leads;

CREATE POLICY "Usuários podem atualizar leads conforme permissões" 
ON public.leads 
FOR UPDATE 
USING (
  -- Próprio usuário pode atualizar seus leads
  user_id = auth.uid() 
  OR 
  -- Admins podem atualizar qualquer lead, independente do status
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
  OR 
  -- Gestores podem atualizar leads da sua equipe OU se têm permissão para ver todos
  (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'gestor'
    ) 
    AND (
      -- Mesmo equipe
      EXISTS (
        SELECT 1 FROM public.users current_user, public.users lead_user
        WHERE current_user.id = auth.uid() 
        AND lead_user.id = leads.user_id
        AND current_user.equipe_id = lead_user.equipe_id
        AND current_user.equipe_id IS NOT NULL
      )
      OR 
      -- Ou tem permissão para ver todos os leads
      EXISTS (
        SELECT 1 FROM public.permissions p
        JOIN public.users u ON u.id = p.user_id
        WHERE p.user_id = auth.uid() 
        AND p.can_view_all_leads = true
      )
    )
  )
);