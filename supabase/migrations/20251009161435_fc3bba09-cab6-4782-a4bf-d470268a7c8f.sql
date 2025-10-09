-- Deletar usuário Rafael Monhé de forma completa
DO $$
DECLARE
  user_id_to_delete UUID := '87becd4e-df0d-4634-b2e7-71276780f573';
  user_company_id UUID := 'c95541d9-3e6a-4fc1-8d64-c5a6d5f7c9b6';
  new_assigned_user UUID;
BEGIN
  -- 1. Reatribuir leads para outro corretor ativo da mesma empresa
  SELECT id INTO new_assigned_user
  FROM users
  WHERE company_id = user_company_id
    AND status = 'ativo'
    AND id != user_id_to_delete
  LIMIT 1;

  IF new_assigned_user IS NOT NULL THEN
    UPDATE leads
    SET user_id = new_assigned_user
    WHERE user_id = user_id_to_delete;
    RAISE NOTICE 'Leads reatribuídos para usuário %', new_assigned_user;
  END IF;

  -- 2. Deletar logs do usuário (IMPORTANTE: antes de deletar o usuário)
  DELETE FROM logs WHERE user_id = user_id_to_delete;
  RAISE NOTICE 'Logs deletados';

  -- 3. Deletar permissões do usuário
  DELETE FROM permissions WHERE user_id = user_id_to_delete;
  RAISE NOTICE 'Permissões deletadas';

  -- 4. Deletar subscrições push do usuário
  DELETE FROM push_subscriptions WHERE user_id = user_id_to_delete;
  RAISE NOTICE 'Subscrições push deletadas';

  -- 5. Deletar da fila de leads
  DELETE FROM lead_queue WHERE assigned_to = user_id_to_delete;
  RAISE NOTICE 'Registros da fila deletados';

  -- 6. Deletar da tabela users
  DELETE FROM users WHERE id = user_id_to_delete;
  RAISE NOTICE '✓ Usuário Rafael Monhé deletado com sucesso';

END $$;