-- Corrigir sistema round-robin: remover triggers conflitantes e implementar adequadamente

-- 1. Remover triggers conflitantes
DROP TRIGGER IF EXISTS assign_lead_to_creator ON public.leads;
DROP TRIGGER IF EXISTS assign_lead_round_robin_trigger ON public.leads;

-- 2. Atualizar função round-robin para não depender de auth.uid()
CREATE OR REPLACE FUNCTION public.get_next_user_round_robin(_company_id uuid DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  next_user_id UUID;
  target_company_id UUID;
BEGIN
  -- Se company_id não foi fornecido, tentar obter do usuário logado
  IF _company_id IS NULL THEN
    SELECT company_id INTO target_company_id 
    FROM public.users 
    WHERE id = auth.uid();
    
    -- Se ainda for NULL, usar a primeira empresa ativa (para casos de API externa)
    IF target_company_id IS NULL THEN
      SELECT id INTO target_company_id 
      FROM public.companies 
      LIMIT 1;
    END IF;
  ELSE
    target_company_id := _company_id;
  END IF;

  IF target_company_id IS NULL THEN
    RAISE EXCEPTION 'Nenhuma empresa encontrada para atribuição';
  END IF;

  -- Buscar usuário da empresa que recebeu lead há mais tempo
  SELECT id INTO next_user_id
  FROM users
  WHERE status = 'ativo' 
  AND company_id = target_company_id
  ORDER BY 
    ultimo_lead_recebido NULLS FIRST,
    ultimo_lead_recebido ASC
  LIMIT 1;

  IF next_user_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum usuário ativo disponível para atribuição na empresa %', target_company_id;
  END IF;

  -- Atualizar timestamp do último lead recebido
  UPDATE users 
  SET ultimo_lead_recebido = now()
  WHERE id = next_user_id;

  RETURN next_user_id;
END;
$$;

-- 3. Criar novo trigger unificado de atribuição
CREATE OR REPLACE FUNCTION public.assign_lead_unified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  assigned_user_id UUID;
  current_company_id UUID;
BEGIN
  -- Se user_id já foi definido explicitamente, manter
  IF NEW.user_id IS NOT NULL THEN
    -- Apenas definir company_id se não estiver definido
    IF NEW.company_id IS NULL THEN
      SELECT company_id INTO NEW.company_id 
      FROM public.users 
      WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
  END IF;

  -- Determinar company_id para atribuição
  IF NEW.company_id IS NOT NULL THEN
    current_company_id := NEW.company_id;
  ELSE
    -- Tentar obter do usuário logado
    SELECT company_id INTO current_company_id 
    FROM public.users 
    WHERE id = auth.uid();
    
    -- Se ainda for NULL, usar primeira empresa (para API externa)
    IF current_company_id IS NULL THEN
      SELECT id INTO current_company_id 
      FROM public.companies 
      LIMIT 1;
    END IF;
  END IF;

  -- Atribuir usando round-robin
  assigned_user_id := public.get_next_user_round_robin(current_company_id);
  
  NEW.user_id := assigned_user_id;
  NEW.company_id := current_company_id;
  
  RAISE NOTICE 'Lead % atribuído para usuário % via round-robin na empresa %', NEW.id, assigned_user_id, current_company_id;
  
  RETURN NEW;
END;
$$;

-- 4. Criar trigger unificado
CREATE TRIGGER assign_lead_unified_trigger
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION assign_lead_unified();