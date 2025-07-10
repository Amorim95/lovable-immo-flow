-- Permitir que edge functions (service role) criem usuários e permissões
-- Criar políticas para permitir inserção via service role

-- Adicionar política para permitir inserção de usuários via service role
CREATE POLICY "Service role pode inserir usuários" 
ON public.users 
FOR INSERT 
WITH CHECK (true);

-- Adicionar política para permitir inserção de permissões via service role  
CREATE POLICY "Service role pode inserir permissões" 
ON public.permissions 
FOR INSERT 
WITH CHECK (true);

-- Adicionar política para permitir deleção por service role (para rollback)
CREATE POLICY "Service role pode deletar usuários" 
ON public.users 
FOR DELETE 
USING (true);

CREATE POLICY "Service role pode deletar permissões" 
ON public.permissions 
FOR DELETE 
USING (true);