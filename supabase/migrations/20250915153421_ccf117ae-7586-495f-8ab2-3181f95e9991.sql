-- Remover trigger de validação de duplicata pois agora é feito pela função create_lead_safe
DROP TRIGGER IF EXISTS validate_duplicate_lead_trigger ON leads;

-- Remover função de validação de duplicata por trigger (não mais necessária)
DROP FUNCTION IF EXISTS validate_duplicate_lead();