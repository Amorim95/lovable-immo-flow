-- ===================================================
-- SCRIPT DE SINCRONIZAÇÃO: stage_name ← etapa
-- ===================================================
-- 
-- OBJETIVO: Sincronizar o campo stage_name com etapa
-- para todos os leads que possuem inconsistência.
--
-- COMO USAR:
-- 1. Acesse o Console do Supabase
-- 2. Vá em SQL Editor
-- 3. Cole este script
-- 4. Execute
-- ===================================================

-- Verificar quantos leads precisam ser sincronizados
SELECT 
  company_id,
  COUNT(*) as leads_desincronizados
FROM leads
WHERE stage_name IS DISTINCT FROM etapa::text
GROUP BY company_id;

-- Executar sincronização
UPDATE leads 
SET 
  stage_name = etapa::text,
  updated_at = now()
WHERE stage_name IS DISTINCT FROM etapa::text;

-- Verificar resultado (todos devem estar sincronizados)
SELECT 
  company_id,
  COUNT(*) as total_leads_sincronizados
FROM leads
WHERE stage_name = etapa::text
GROUP BY company_id
ORDER BY total_leads_sincronizados DESC;

-- Resultado esperado:
-- Click Imóveis: 1728 leads sincronizados
-- Vivaz Imóveis: 167 leads sincronizados
