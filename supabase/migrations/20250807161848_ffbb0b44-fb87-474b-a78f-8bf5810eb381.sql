-- Criar função para round-robin real (cada usuário recebe 1 lead por vez)
CREATE OR REPLACE FUNCTION public.get_next_user_round_robin()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_user_id UUID;
BEGIN
  -- Buscar usuário que recebeu lead há mais tempo (ou nunca recebeu)
  SELECT id INTO next_user_id
  FROM users
  WHERE status = 'ativo'
  ORDER BY 
    ultimo_lead_recebido NULLS FIRST,  -- Prioriza quem nunca recebeu
    ultimo_lead_recebido ASC           -- Depois pela data mais antiga
  LIMIT 1;

  IF next_user_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum usuário ativo disponível para atribuição';
  END IF;

  -- Atualizar timestamp do último lead recebido
  UPDATE users 
  SET ultimo_lead_recebido = now()
  WHERE id = next_user_id;

  RETURN next_user_id;
END;
$$;

-- Criar função trigger para usar round-robin
CREATE OR REPLACE FUNCTION public.assign_lead_round_robin()
RETURNS TRIGGER
LANGUAGE plpgsql
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
  
  NEW.user_id := assigned_user_id;
  
  RAISE NOTICE 'Lead % atribuído para usuário % via round-robin', NEW.id, assigned_user_id;
  
  RETURN NEW;
END;
$$;

-- Remover trigger aleatório antigo
DROP TRIGGER IF EXISTS set_random_user_id ON leads;

-- Criar novo trigger round-robin 
CREATE TRIGGER assign_lead_round_robin_trigger
  BEFORE INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION assign_lead_round_robin();