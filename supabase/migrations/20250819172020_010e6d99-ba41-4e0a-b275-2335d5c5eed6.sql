-- Atualizar política RLS para permitir visualização de usuários independente do status
-- para permitir transferência de leads para qualquer usuário

DROP POLICY IF EXISTS "Usuarios mesma empresa podem se ver" ON public.users;

CREATE POLICY "Usuarios mesma empresa podem se ver" 
ON public.users FOR SELECT 
USING (
  -- Super admins podem ver todos
  (auth.uid() = '40257dfa-1a8e-4c15-a8f7-2cb99cfa4f08'::uuid) OR 
  (auth.uid() = '62926fc7-ffba-4a63-9bae-50f8845a1b67'::uuid) OR 
  -- Usuário pode ver seu próprio perfil
  (id = auth.uid()) OR 
  -- Usuários da mesma empresa podem se ver independente do status
  ((company_id IS NOT NULL) AND (company_id = get_current_user_company_id()))
);