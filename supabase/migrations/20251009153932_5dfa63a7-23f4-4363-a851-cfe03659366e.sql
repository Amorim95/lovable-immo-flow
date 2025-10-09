
-- Habilitar RLS na tabela users_pending_auth_sync
ALTER TABLE public.users_pending_auth_sync ENABLE ROW LEVEL SECURITY;

-- Apenas super admins podem ver e gerenciar esta tabela
CREATE POLICY "Super admins podem gerenciar sync pendente"
ON public.users_pending_auth_sync
FOR ALL
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());
