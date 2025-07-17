-- Corrigir função distribute_lead_to_queue completamente para resolver ambiguidade
CREATE OR REPLACE FUNCTION public.distribute_lead_to_queue()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_corretor uuid;
BEGIN
  -- Obter próximo corretor na fila
  SELECT public.get_next_corretor_in_queue() INTO next_corretor;
  
  -- Se encontrou um corretor, atribuir o lead
  IF next_corretor IS NOT NULL THEN
    INSERT INTO public.lead_queue (lead_id, assigned_to, status, assigned_at)
    VALUES (NEW.id, next_corretor, 'assigned', now());
    
    -- Atualizar o lead com o corretor atribuído (sem ambiguidade)
    NEW.user_id := next_corretor;
  ELSE
    -- Se não há corretores ativos, colocar na fila sem atribuição
    INSERT INTO public.lead_queue (lead_id, status)
    VALUES (NEW.id, 'pending');
    
    -- Usar um corretor padrão ou deixar vazio
    NEW.user_id := (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recriar o trigger
DROP TRIGGER IF EXISTS auto_distribute_leads ON public.leads;
CREATE TRIGGER auto_distribute_leads
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.distribute_lead_to_queue();