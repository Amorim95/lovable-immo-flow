-- Implementar validação de duplicação de leads
-- Evita criação de leads duplicados baseado em telefone e janela de tempo

-- Função para verificar se um lead duplicado já existe
CREATE OR REPLACE FUNCTION public.check_duplicate_lead(
  _telefone text,
  _time_window_minutes integer DEFAULT 5
)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  -- Verifica se existe um lead com o mesmo telefone nos últimos X minutos
  RETURN EXISTS (
    SELECT 1 
    FROM public.leads 
    WHERE telefone = _telefone 
    AND created_at >= (now() - interval '1 minute' * _time_window_minutes)
  );
END;
$$;

-- Função trigger para validar duplicatas antes de inserir
CREATE OR REPLACE FUNCTION public.validate_duplicate_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verificar se já existe um lead com o mesmo telefone nos últimos 5 minutos
  IF public.check_duplicate_lead(NEW.telefone, 5) THEN
    RAISE EXCEPTION 'Lead duplicado detectado. Telefone % já foi registrado nos últimos 5 minutos.', NEW.telefone
      USING ERRCODE = 'P0001';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para validação de duplicatas (executar ANTES do trigger de round-robin)
DROP TRIGGER IF EXISTS validate_duplicate_lead_trigger ON leads;
CREATE TRIGGER validate_duplicate_lead_trigger
  BEFORE INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION validate_duplicate_lead();

-- Atualizar comentário da função para melhor documentação
COMMENT ON FUNCTION public.check_duplicate_lead(text, integer) IS 
'Verifica se existe um lead duplicado com o mesmo telefone dentro de uma janela de tempo especificada';

COMMENT ON FUNCTION public.validate_duplicate_lead() IS 
'Trigger function que previne inserção de leads duplicados baseado no telefone e timestamp';