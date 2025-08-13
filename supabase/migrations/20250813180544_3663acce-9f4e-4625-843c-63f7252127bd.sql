-- Corrigir sistema round-robin para atualizar ultimo_lead_recebido corretamente

-- 1. Primeiro, atualizar os dados existentes baseado nos leads já atribuídos
UPDATE users 
SET ultimo_lead_recebido = (
  SELECT MAX(l.created_at)
  FROM leads l 
  WHERE l.user_id = users.id
)
WHERE id IN (
  SELECT DISTINCT user_id 
  FROM leads 
  WHERE user_id IS NOT NULL
);

-- 2. Corrigir a função assign_lead_unified para atualizar o campo corretamente
CREATE OR REPLACE FUNCTION public.assign_lead_unified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
    
    -- IMPORTANTE: Atualizar ultimo_lead_recebido para o usuário que recebeu o lead
    UPDATE users 
    SET ultimo_lead_recebido = now()
    WHERE id = NEW.user_id;
    
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

  -- Buscar próximo usuário no round-robin DA MESMA EMPRESA
  SELECT id INTO assigned_user_id
  FROM users
  WHERE status = 'ativo' 
  AND company_id = current_company_id
  ORDER BY 
    ultimo_lead_recebido NULLS FIRST,
    ultimo_lead_recebido ASC
  LIMIT 1;

  IF assigned_user_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum usuário ativo disponível para atribuição na empresa %', current_company_id;
  END IF;

  -- Atribuir lead e atualizar timestamp
  NEW.user_id := assigned_user_id;
  NEW.company_id := current_company_id;
  
  -- CRÍTICO: Atualizar ultimo_lead_recebido ANTES de retornar
  UPDATE users 
  SET ultimo_lead_recebido = now()
  WHERE id = assigned_user_id;
  
  RAISE NOTICE 'Lead % atribuído para usuário % via round-robin na empresa %', NEW.id, assigned_user_id, current_company_id;
  
  RETURN NEW;
END;
$$;

-- 3. Atualizar função get_next_user_round_robin para não modificar dados (só consultar)
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

  -- Buscar usuário da empresa que recebeu lead há mais tempo (SEM ATUALIZAR)
  SELECT id INTO next_user_id
  FROM users
  WHERE status = 'ativo' 
  AND company_id = target_company_id
  ORDER BY 
    ultimo_lead_recebido NULLS FIRST,
    ultimo_lead_recebido ASC
  LIMIT 1;

  RETURN next_user_id;
END;
$$;