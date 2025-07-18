-- TESTE BÁSICO: Remover RLS temporariamente para testar
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;

-- Ou criar política super permissiva
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Inserção permitida para usuários autenticados" ON public.leads;

-- Política mais básica possível
CREATE POLICY "Permitir INSERT para todos autenticados" 
ON public.leads 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Verificar todas as políticas atuais
SELECT policyname, cmd, permissive, with_check, qual
FROM pg_policies 
WHERE tablename = 'leads';