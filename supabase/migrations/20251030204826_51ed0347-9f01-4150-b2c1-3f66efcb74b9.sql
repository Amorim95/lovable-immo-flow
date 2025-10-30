-- Atualização em massa: copiar etapa para stage_name em leads sem stage_name
UPDATE leads 
SET stage_name = etapa::text,
    updated_at = now()
WHERE stage_name IS NULL 
  AND etapa IS NOT NULL;