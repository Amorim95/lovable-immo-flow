-- Atualizar política de UPDATE para permitir que admins e gestores transfiram leads
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios leads ou todos se tive" ON public.leads;

-- Criar nova política de UPDATE mais específica
CREATE POLICY "Usuários podem atualizar leads conforme permissões" 
ON public.leads 
FOR UPDATE 
USING (
  -- Dono do lead pode atualizar
  user_id = auth.uid() 
  OR 
  -- Admin pode atualizar qualquer lead
  (
    SELECT role FROM users WHERE id = auth.uid()
  ) = 'admin'
  OR
  -- Gestor pode atualizar leads da mesma equipe ou se tiver permissão can_view_all_leads
  (
    (
      SELECT role FROM users WHERE id = auth.uid()
    ) = 'gestor' 
    AND 
    (
      -- Mesma equipe
      (
        SELECT equipe_id FROM users WHERE id = auth.uid()
      ) = (
        SELECT equipe_id FROM users WHERE id = leads.user_id
      )
      OR 
      -- Ou tem permissão can_view_all_leads
      EXISTS (
        SELECT 1 FROM permissions p
        JOIN users u ON u.id = p.user_id
        WHERE p.user_id = auth.uid() 
        AND p.can_view_all_leads = true 
        AND u.status = 'ativo'
      )
    )
  )
);