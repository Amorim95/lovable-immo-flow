-- Corrigir recursão infinita na política de SELECT de public.users
DROP POLICY IF EXISTS "Usuarios mesma empresa podem se ver" ON public.users;

CREATE POLICY "Usuarios mesma empresa podem se ver"
ON public.users FOR SELECT
USING (
  -- Super admins
  auth.uid() = '40257dfa-1a8e-4c15-a8f7-2cb99cfa4f08'::uuid OR
  auth.uid() = '62926fc7-ffba-4a63-9bae-50f8845a1b67'::uuid OR
  -- Usuário pode ver seu próprio registro
  id = auth.uid() OR
  -- Mesma empresa (via função SECURITY DEFINER, evitando recursão)
  company_id = public.get_current_user_company_id()
);