-- Remover triggers existentes
DROP TRIGGER IF EXISTS distribute_lead_trigger ON public.leads;
DROP TRIGGER IF EXISTS add_to_queue_trigger ON public.leads;

-- Criar função simples para atribuir lead ao criador
CREATE OR REPLACE FUNCTION public.assign_lead_to_creator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Se user_id não estiver definido, atribuir ao usuário logado
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Criar trigger simples BEFORE INSERT
CREATE TRIGGER assign_lead_trigger
  BEFORE INSERT ON public.leads
  FOR EACH ROW 
  EXECUTE FUNCTION public.assign_lead_to_creator();

-- Atualizar função para adicionar à fila (mais simples)
CREATE OR REPLACE FUNCTION public.add_lead_to_queue()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Inserir na fila após o lead ser criado
  INSERT INTO public.lead_queue (lead_id, assigned_to, status, assigned_at)
  VALUES (NEW.id, NEW.user_id, 'assigned', now());
  
  RETURN NEW;
END;
$function$;

-- Recriar trigger AFTER INSERT para fila
CREATE TRIGGER add_to_queue_trigger
  AFTER INSERT ON public.leads
  FOR EACH ROW 
  EXECUTE FUNCTION public.add_lead_to_queue();