-- Limpar registros duplicados, mantendo apenas o mais recente
WITH latest_setting AS (
  SELECT id 
  FROM company_settings 
  ORDER BY created_at DESC 
  LIMIT 1
)
DELETE FROM company_settings 
WHERE id NOT IN (SELECT id FROM latest_setting);