-- Criar trigger para distribuição automática de leads em round-robin
-- Isso garantirá que cada usuário ativo receba leads de forma equilibrada

-- Primeiro, remover qualquer trigger antigo se existir
DROP TRIGGER IF EXISTS assign_lead_round_robin_trigger ON leads;

-- Criar novo trigger que executa ANTES do INSERT
CREATE TRIGGER assign_lead_round_robin_trigger
  BEFORE INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION assign_lead_round_robin();

-- Verificar se a função assign_lead_round_robin existe e atualizar se necessário
CREATE OR REPLACE FUNCTION public.assign_lead_round_robin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  assigned_user_id UUID;
BEGIN
  -- Se user_id já foi definido, manter
  IF NEW.user_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Obter próximo usuário no round-robin
  assigned_user_id := public.get_next_user_round_robin();
  
  -- Atribuir o lead ao usuário
  NEW.user_id := assigned_user_id;
  
  -- Log para debug
  RAISE NOTICE 'Lead % atribuído para usuário % via round-robin', NEW.id, assigned_user_id;
  
  RETURN NEW;
END;
$$;