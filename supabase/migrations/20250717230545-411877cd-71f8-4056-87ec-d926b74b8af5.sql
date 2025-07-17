-- Corrigir função para inserir na lead_queue APÓS o commit do lead
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
    NEW.user_id := next_corretor;
  ELSE
    -- Se não há corretores ativos, atribuir ao admin
    SELECT id INTO admin_user FROM public.users WHERE role = 'admin' AND status = 'ativo' LIMIT 1;
    
    IF admin_user IS NOT NULL THEN
      NEW.user_id := admin_user;
    ELSE
      -- Se nem admin existe, usar o primeiro usuário disponível
      SELECT id INTO admin_user FROM public.users WHERE status = 'ativo' LIMIT 1;
      NEW.user_id := COALESCE(admin_user, gen_random_uuid());
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar função separada para inserir na fila APÓS o lead ser criado
CREATE OR REPLACE FUNCTION public.add_lead_to_queue()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Inserir na fila após o lead ser criado
  INSERT INTO public.lead_queue (lead_id, assigned_to, status, assigned_at)
  VALUES (NEW.id, NEW.user_id, 'assigned', now());
  
  RETURN NEW;
END;
$$;

-- Recriar os triggers na ordem correta
DROP TRIGGER IF EXISTS auto_distribute_leads ON public.leads;
DROP TRIGGER IF EXISTS add_to_queue ON public.leads;

CREATE TRIGGER auto_distribute_leads
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.distribute_lead_to_queue();

CREATE TRIGGER add_to_queue
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.add_lead_to_queue();