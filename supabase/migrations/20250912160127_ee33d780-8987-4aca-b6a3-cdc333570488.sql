-- Remover política existente que restringia acesso a admins e donos
DROP POLICY IF EXISTS "Admins e donos podem gerenciar tags" ON public.lead_tags;

-- Política para INSERT - qualquer usuário autenticado pode adicionar tags
CREATE POLICY "Qualquer usuário pode adicionar tags"
ON public.lead_tags
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política para UPDATE - apenas super admins podem editar tags
CREATE POLICY "Super admins podem editar tags"
ON public.lead_tags
FOR UPDATE
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Política para DELETE - apenas super admins podem apagar tags
CREATE POLICY "Super admins podem apagar tags"
ON public.lead_tags
FOR DELETE
TO authenticated
USING (is_super_admin());

-- Manter a política de SELECT que já existe (todos podem ver)