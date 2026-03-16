-- Update create_lead_safe to normalize phone numbers before comparison
CREATE OR REPLACE FUNCTION public.create_lead_safe(_nome text, _telefone text, _dados_adicionais text DEFAULT NULL::text, _company_id uuid DEFAULT NULL::uuid, _user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(lead_id uuid, is_duplicate boolean, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  existing_lead_id uuid;
  new_lead_id uuid;
  normalized_phone text;
BEGIN
  -- Normalizar telefone: remover tudo que não é dígito
  normalized_phone := regexp_replace(_telefone, '[^0-9]', '', 'g');
  
  -- Verificar se já existe um lead com o mesmo telefone normalizado na mesma empresa
  SELECT id INTO existing_lead_id
  FROM public.leads 
  WHERE regexp_replace(telefone, '[^0-9]', '', 'g') = normalized_phone
  AND company_id = _company_id
  LIMIT 1;
  
  -- Se encontrou duplicata, retornar como duplicata (SEM ERRO)
  IF existing_lead_id IS NOT NULL THEN
    RETURN QUERY SELECT existing_lead_id, true, 'Lead já existe (duplicata ignorada)'::text;
    RETURN;
  END IF;
  
  -- Inserir o novo lead com telefone normalizado (apenas dígitos)
  INSERT INTO public.leads (
    nome, 
    telefone, 
    dados_adicionais, 
    etapa, 
    atividades, 
    company_id, 
    user_id
  ) VALUES (
    _nome,
    normalized_phone,
    _dados_adicionais,
    'aguardando-atendimento',
    '[]'::jsonb,
    _company_id,
    _user_id
  ) RETURNING id INTO new_lead_id;
  
  -- Retornar sucesso
  RETURN QUERY SELECT new_lead_id, false, 'Lead criado com sucesso'::text;
  
EXCEPTION
  WHEN unique_violation THEN
    SELECT id INTO existing_lead_id
    FROM public.leads 
    WHERE regexp_replace(telefone, '[^0-9]', '', 'g') = normalized_phone
    AND company_id = _company_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    RETURN QUERY SELECT existing_lead_id, true, 'Lead já existe (race condition detectada)'::text;
END;
$function$;

-- Also update check_duplicate_lead to use normalized comparison
CREATE OR REPLACE FUNCTION public.check_duplicate_lead(_telefone text, _time_window_minutes integer DEFAULT 5)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.leads 
    WHERE regexp_replace(telefone, '[^0-9]', '', 'g') = regexp_replace(_telefone, '[^0-9]', '', 'g')
    AND created_at >= (now() - interval '1 minute' * _time_window_minutes)
  );
END;
$function$;