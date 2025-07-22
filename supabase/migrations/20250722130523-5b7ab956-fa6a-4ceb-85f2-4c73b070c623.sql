-- Corrigir políticas RLS para permitir que usuários vejam tags
-- Primeiro, verificar se a política atual é muito restritiva

-- Remover política atual se for muito restritiva
DROP POLICY IF EXISTS "Usuários ativos podem ver tags" ON public.lead_tags;

-- Criar nova política mais permissiva para visualização de tags
CREATE POLICY "Usuários autenticados podem ver tags" 
ON public.lead_tags 
FOR SELECT 
TO authenticated
USING (true);

-- Criar política para permitir que admins/gestores gerenciem tags
CREATE POLICY "Admins podem gerenciar tags" 
ON public.lead_tags 
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
    AND status = 'ativo'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
    AND status = 'ativo'
  )
);