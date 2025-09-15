-- Criar função mais robusta para inserir lead sem duplicatas usando transação
CREATE OR REPLACE FUNCTION public.create_lead_safe(
  _nome text,
  _telefone text,
  _dados_adicionais text DEFAULT NULL,
  _company_id uuid DEFAULT NULL,
  _user_id uuid DEFAULT NULL
)
RETURNS TABLE(
  lead_id uuid,
  is_duplicate boolean,
  message text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_lead_id uuid;
  new_lead_id uuid;
BEGIN
  -- Verificar se já existe um lead com o mesmo telefone nos últimos 30 segundos
  SELECT id INTO existing_lead_id
  FROM public.leads 
  WHERE telefone = _telefone 
  AND created_at >= (now() - interval '30 seconds')
  LIMIT 1;
  
  -- Se encontrou duplicata recente, retornar como duplicata
  IF existing_lead_id IS NOT NULL THEN
    RETURN QUERY SELECT existing_lead_id, true, 'Lead já existe (duplicata ignorada)'::text;
    RETURN;
  END IF;
  
  -- Tentar inserir o novo lead
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
    _telefone,
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
    -- Se houve violação de única (telefone duplicado), buscar o lead existente
    SELECT id INTO existing_lead_id
    FROM public.leads 
    WHERE telefone = _telefone 
    ORDER BY created_at DESC
    LIMIT 1;
    
    RETURN QUERY SELECT existing_lead_id, true, 'Lead já existe (race condition detectada)'::text;
END;
$$;