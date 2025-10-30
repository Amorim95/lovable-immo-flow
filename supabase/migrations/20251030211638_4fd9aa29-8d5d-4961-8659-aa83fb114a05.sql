-- Função que sincroniza stage_name com etapa automaticamente
CREATE OR REPLACE FUNCTION sync_stage_name_with_etapa()
RETURNS TRIGGER AS $$
BEGIN
  -- Se stage_name está vazio/null OU etapa mudou, sincronizar
  IF NEW.stage_name IS NULL OR NEW.stage_name = '' OR 
     (TG_OP = 'UPDATE' AND OLD.etapa IS DISTINCT FROM NEW.etapa) THEN
    NEW.stage_name := NEW.etapa::text;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger BEFORE INSERT OR UPDATE na tabela leads
CREATE TRIGGER trigger_sync_stage_name
BEFORE INSERT OR UPDATE OF etapa ON leads
FOR EACH ROW
EXECUTE FUNCTION sync_stage_name_with_etapa();