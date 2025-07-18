-- CORRIGIR POLÍTICA DE INSERT para leads

-- Remover política atual que pode estar bloqueando
DROP POLICY IF EXISTS "Corretores podem inserir leads" ON public.leads;

-- Criar nova política de INSERT mais permissiva
CREATE POLICY "Usuários autenticados podem inserir leads" 
ON public.leads 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Também criar política para permitir que usuários vejam seus próprios leads
-- (caso não exista)
DROP POLICY IF EXISTS "Corretores podem ver seus próprios leads" ON public.leads;
CREATE POLICY "Corretores podem ver seus próprios leads" 
ON public.leads 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());