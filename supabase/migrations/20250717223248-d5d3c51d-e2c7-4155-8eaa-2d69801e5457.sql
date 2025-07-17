-- Corrigir erro de user_id ambíguo na função distribute_lead_to_queue
DROP FUNCTION IF EXISTS public.distribute_lead_to_queue() CASCADE;

CREATE OR REPLACE FUNCTION public.distribute_lead_to_queue()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  next_corretor uuid;
BEGIN
  -- Obter próximo corretor na fila
  SELECT public.get_next_corretor_in_queue() INTO next_corretor;
  
  -- Se encontrou um corretor, atribuir o lead
  IF next_corretor IS NOT NULL THEN
    INSERT INTO public.lead_queue (lead_id, assigned_to, status, assigned_at)
    VALUES (NEW.id, next_corretor, 'assigned', now());
    
    -- Atualizar o lead com o corretor atribuído (especificando a tabela public.leads)
    UPDATE public.leads 
    SET user_id = next_corretor
    WHERE public.leads.id = NEW.id;
  ELSE
    -- Se não há corretores ativos, colocar na fila sem atribuição
    INSERT INTO public.lead_queue (lead_id, status)
    VALUES (NEW.id, 'pending');
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recriar o trigger
DROP TRIGGER IF EXISTS trigger_distribute_lead_to_queue ON public.leads;
CREATE TRIGGER trigger_distribute_lead_to_queue
  AFTER INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.distribute_lead_to_queue();