-- Corrigir a função get_next_user_round_robin para atualizar o timestamp atomicamente
-- Isso evita condições de corrida quando múltiplos leads são criados simultaneamente

CREATE OR REPLACE FUNCTION public.get_next_user_round_robin(_company_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- CRÍTICO: Buscar e atualizar o usuário em uma operação atômica
  -- Isso evita condições de corrida quando múltiplos leads são processados simultaneamente
  UPDATE users 
  SET ultimo_lead_recebido = now()
  WHERE id = (
    SELECT id 
    FROM users
    WHERE status = 'ativo' 
    AND company_id = target_company_id
    ORDER BY 
      ultimo_lead_recebido NULLS FIRST,
      ultimo_lead_recebido ASC,
      id ASC  -- Adicionado para garantir ordem determinística
    LIMIT 1
    FOR UPDATE SKIP LOCKED  -- Evita deadlocks e pula registros locked
  )
  RETURNING id INTO next_user_id;

  IF next_user_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum usuário ativo disponível para atribuição na empresa %', target_company_id;
  END IF;

  RETURN next_user_id;
END;
$function$;