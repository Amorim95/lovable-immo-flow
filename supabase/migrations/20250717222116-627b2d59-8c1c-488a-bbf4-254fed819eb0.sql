-- Corrigir política de INSERT para leads
DROP POLICY IF EXISTS "Corretores podem inserir leads" ON public.leads;

CREATE POLICY "Corretores podem inserir leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (
  -- Permitir que usuários autenticados insiram leads
  -- O user_id será atribuído automaticamente pelo trigger
  auth.uid() IS NOT NULL
);