-- Criar política para permitir que admins e gestores alterem status de outros usuários
CREATE POLICY "Admins e gestores podem alterar status de usuarios" 
ON public.users 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('admin', 'gestor', 'dono')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('admin', 'gestor', 'dono')
  )
);