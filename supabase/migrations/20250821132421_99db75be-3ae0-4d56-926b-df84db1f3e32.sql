-- Permitir visualização de usuários independente do status para filtros
-- Atualizar a política de usuários para permitir ver todos os usuários da empresa independente do status

-- Primeiro, vamos criar uma nova política mais permissiva para visualização de usuários
DROP POLICY IF EXISTS "Usuarios mesma empresa podem se ver" ON public.users;

CREATE POLICY "Usuarios mesma empresa podem se ver" 
ON public.users FOR SELECT
USING (
  -- Super admins podem ver todos
  (auth.uid() = '40257dfa-1a8e-4c15-a8f7-2cb99cfa4f08'::uuid) OR 
  (auth.uid() = '62926fc7-ffba-4a63-9bae-50f8845a1b67'::uuid) OR 
  -- Usuário pode ver seu próprio perfil
  (id = auth.uid()) OR 
  -- Usuários da mesma empresa podem se ver (removendo qualquer restrição de status)
  (
    (company_id IS NOT NULL) AND 
    (company_id IN (
      SELECT company_id 
      FROM public.users 
      WHERE id = auth.uid()
    ))
  )
);