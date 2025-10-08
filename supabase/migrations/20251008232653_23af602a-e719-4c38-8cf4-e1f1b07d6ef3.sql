-- Atualizar função create_lead_safe para verificar duplicatas sem limite de tempo
CREATE OR REPLACE FUNCTION public.create_lead_safe(
  _nome text, 
  _telefone text, 
  _dados_adicionais text DEFAULT NULL::text, 
  _company_id uuid DEFAULT NULL::uuid, 
  _user_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(lead_id uuid, is_duplicate boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_lead_id uuid;
  new_lead_id uuid;
BEGIN
  -- Verificar se já existe um lead com o mesmo telefone na mesma empresa (SEM LIMITE DE TEMPO)
  SELECT id INTO existing_lead_id
  FROM public.leads 
  WHERE telefone = _telefone 
  AND company_id = _company_id
  LIMIT 1;
  
  -- Se encontrou duplicata, retornar como duplicata (SEM ERRO)
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
    -- Se houve violação de única (race condition), buscar o lead existente
    SELECT id INTO existing_lead_id
    FROM public.leads 
    WHERE telefone = _telefone 
    AND company_id = _company_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Retornar como duplicata (SEM ERRO)
    RETURN QUERY SELECT existing_lead_id, true, 'Lead já existe (race condition detectada)'::text;
END;
$$;