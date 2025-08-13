-- Testar a função assign_lead_unified manualmente
DO $$
DECLARE
  test_user_id UUID;
  test_company_id UUID := 'c95541d9-3e6a-4fc1-8d64-c5a6d5f7c9b6';
BEGIN
  -- Buscar o próximo usuário usando a mesma lógica da função
  SELECT id INTO test_user_id
  FROM users
  WHERE status = 'ativo' 
  AND company_id = test_company_id
  ORDER BY 
    ultimo_lead_recebido NULLS FIRST,
    ultimo_lead_recebido ASC
  LIMIT 1;
  
  RAISE NOTICE 'Usuário selecionado para teste: %', test_user_id;
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE 'ERRO: Nenhum usuário encontrado!';
  ELSE
    RAISE NOTICE 'Usuário encontrado com sucesso: %', test_user_id;
  END IF;
END $$;