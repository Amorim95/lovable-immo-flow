-- Adicionar política para permitir que admins e gestores criem equipes
CREATE POLICY "Admins e gestores podem criar equipes" 
ON public.equipes 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND status = 'ativo' 
    AND (role = 'admin' OR role = 'gestor')
  )
);

-- Adicionar política para permitir que admins e gestores atualizem equipes
CREATE POLICY "Admins e gestores podem atualizar equipes" 
ON public.equipes 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND status = 'ativo' 
    AND (role = 'admin' OR role = 'gestor')
  )
);

-- Adicionar política para permitir que admins deletem equipes
CREATE POLICY "Admins podem deletar equipes" 
ON public.equipes 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND status = 'ativo' 
    AND role = 'admin'
  )
);