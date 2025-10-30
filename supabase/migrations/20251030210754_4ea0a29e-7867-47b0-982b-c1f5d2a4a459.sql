-- Sincronizar stage_name com etapa para leads com stage_name = 'Recuperar'
UPDATE leads 
SET stage_name = etapa::text,
    updated_at = now()
WHERE stage_name = 'Recuperar';