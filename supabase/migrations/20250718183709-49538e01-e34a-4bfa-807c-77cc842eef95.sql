-- Adicionar política para permitir que admins e gestores atualizem equipe_id de usuários
CREATE POLICY "Admins e gestores podem atualizar equipe_id de usuários" 
ON public.users 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND status = 'ativo' 
    AND (role = 'admin' OR role = 'gestor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND status = 'ativo' 
    AND (role = 'admin' OR role = 'gestor')
  )
);