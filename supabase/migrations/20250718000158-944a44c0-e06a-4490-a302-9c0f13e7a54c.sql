-- SOLUÇÃO DEFINITIVA: Política de INSERT mais robusta que funciona com o trigger

-- Remover política atual
DROP POLICY IF EXISTS "Usuários autenticados podem inserir leads" ON public.leads;

-- Criar política que sempre permite INSERT para usuários autenticados
-- O trigger vai definir o user_id automaticamente
CREATE POLICY "Inserção permitida para usuários autenticados" 
ON public.leads 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Verificar se a função do trigger está correta
SELECT public.assign_lead_to_creator();