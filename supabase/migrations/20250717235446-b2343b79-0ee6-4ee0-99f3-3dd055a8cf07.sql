-- Limpar funções antigas que podem estar causando conflito
DROP FUNCTION IF EXISTS public.distribute_lead_to_queue() CASCADE;
DROP FUNCTION IF EXISTS public.simple_lead_assignment() CASCADE;
DROP FUNCTION IF EXISTS public.get_next_corretor_in_queue() CASCADE;

-- Verificar se todos os triggers estão corretos
SELECT t.tgname as trigger_name, 
       CASE t.tgtype & 2 WHEN 0 THEN 'AFTER' ELSE 'BEFORE' END as timing,
       p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'leads' AND NOT t.tgisinternal
ORDER BY t.tgname;