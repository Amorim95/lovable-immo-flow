-- Corrigir política de INSERT para leads
DROP POLICY IF EXISTS "Corretores podem inserir leads" ON public.leads;

CREATE POLICY "Corretores podem inserir leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (true);

-- Verificar se as funções estão funcionando
SELECT 
  p.proname as function_name,
  pg_get_function_result(p.oid) as return_type,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p 
JOIN pg_namespace n ON p.pronamespace = n.oid 
WHERE n.nspname = 'public' 
  AND p.proname IN ('distribute_lead_to_queue', 'add_lead_to_queue', 'get_next_corretor_in_queue');