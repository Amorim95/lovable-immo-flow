-- Limpar configurações duplicadas, mantendo apenas a mais recente para cada empresa
DELETE FROM company_settings 
WHERE id IN (
  SELECT id 
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY company_id ORDER BY created_at DESC) as rn
    FROM company_settings
    WHERE company_id IS NOT NULL
  ) ranked
  WHERE rn > 1
);

-- Deletar configurações órfãs (sem company_id)
DELETE FROM company_settings WHERE company_id IS NULL;