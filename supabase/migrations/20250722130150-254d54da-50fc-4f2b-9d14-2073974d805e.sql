-- Alterar política de criação de leads para permitir usuários inativos
DROP POLICY IF EXISTS "Usuarios ativos podem criar leads" ON public.leads;

CREATE POLICY "Usuarios autenticados podem criar leads" 
ON public.leads 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid()
  )
);

-- Alterar política de atualização de usuários para permitir gestores/admins inativos
DROP POLICY IF EXISTS "Admins e gestores podem atualizar equipe_id de usuários" ON public.users;

CREATE POLICY "Admins e gestores podem atualizar usuarios" 
ON public.users 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users users_1
    WHERE users_1.id = auth.uid() 
    AND (users_1.role = 'admin' OR users_1.role = 'gestor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users users_1
    WHERE users_1.id = auth.uid() 
    AND (users_1.role = 'admin' OR users_1.role = 'gestor')
  )
);