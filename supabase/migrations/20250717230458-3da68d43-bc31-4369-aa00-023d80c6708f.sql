-- Corrigir função para permitir criação de leads mesmo sem corretores ativos
CREATE OR REPLACE FUNCTION public.distribute_lead_to_queue()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_corretor uuid;
  admin_user uuid;
BEGIN
  -- Obter próximo corretor na fila
  SELECT public.get_next_corretor_in_queue() INTO next_corretor;
  
  -- Se encontrou um corretor, atribuir o lead
  IF next_corretor IS NOT NULL THEN
    INSERT INTO public.lead_queue (lead_id, assigned_to, status, assigned_at)
    VALUES (NEW.id, next_corretor, 'assigned', now());
    
    NEW.user_id := next_corretor;
  ELSE
    -- Se não há corretores ativos, atribuir ao admin ou criar fila pendente
    SELECT id INTO admin_user FROM public.users WHERE role = 'admin' AND status = 'ativo' LIMIT 1;
    
    IF admin_user IS NOT NULL THEN
      NEW.user_id := admin_user;
      INSERT INTO public.lead_queue (lead_id, assigned_to, status, assigned_at)
      VALUES (NEW.id, admin_user, 'pending_assignment', now());
    ELSE
      -- Se nem admin existe, usar um UUID padrão (isso não deveria acontecer)
      NEW.user_id := gen_random_uuid();
      INSERT INTO public.lead_queue (lead_id, status)
      VALUES (NEW.id, 'no_user_available');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Testar criação de lead simples
INSERT INTO public.leads (nome, telefone, dados_adicionais, etapa) 
VALUES ('Teste Lead', '11987654321', 'Lead de teste do sistema', 'aguardando-atendimento');

-- Verificar se o lead foi criado corretamente
SELECT l.*, u.name as corretor_nome FROM leads l 
LEFT JOIN users u ON l.user_id = u.id 
ORDER BY l.created_at DESC LIMIT 1;