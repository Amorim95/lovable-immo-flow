-- CORREÇÃO DEFINITIVA: Remover todas as funções problemáticas e recriar sem ambiguidade

-- 1. Remover todos os triggers
DROP TRIGGER IF EXISTS assign_lead_to_creator_trigger ON public.leads;
DROP TRIGGER IF EXISTS add_lead_to_queue_trigger ON public.leads;
DROP TRIGGER IF EXISTS log_lead_changes_trigger ON public.leads;
DROP TRIGGER IF EXISTS update_leads_updated_at_trigger ON public.leads;

-- 2. Recriar função de atribuição SEM ambiguidade
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

-- 3. Recriar função de fila SEM ambiguidade  
CREATE OR REPLACE FUNCTION public.add_lead_to_queue()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Inserir na fila usando NEW.id e NEW.user_id explicitamente
  INSERT INTO public.lead_queue (lead_id, assigned_to, status, assigned_at)
  VALUES (NEW.id, NEW.user_id, 'assigned', now());
  
  RETURN NEW;
END;
$function$;

-- 4. Corrigir função de logs SEM ambiguidade
CREATE OR REPLACE FUNCTION public.log_lead_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.logs (user_id, action, entity, entity_id, details)
    VALUES (NEW.user_id, 'Lead criado', 'lead', NEW.id, row_to_json(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log apenas se houve mudança na etapa
    IF OLD.etapa != NEW.etapa THEN
      INSERT INTO public.logs (user_id, action, entity, entity_id, details)
      VALUES (
        auth.uid(), 
        'Etapa alterada de ' || OLD.etapa || ' para ' || NEW.etapa, 
        'lead', 
        NEW.id,
        jsonb_build_object('old_etapa', OLD.etapa, 'new_etapa', NEW.etapa)
      );
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$function$;

-- 5. Recriar APENAS os triggers essenciais na ordem correta
CREATE TRIGGER assign_lead_to_creator_trigger
  BEFORE INSERT ON public.leads
  FOR EACH ROW 
  EXECUTE FUNCTION public.assign_lead_to_creator();

CREATE TRIGGER update_leads_updated_at_trigger
  BEFORE UPDATE ON public.leads
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER add_lead_to_queue_trigger
  AFTER INSERT ON public.leads
  FOR EACH ROW 
  EXECUTE FUNCTION public.add_lead_to_queue();

CREATE TRIGGER log_lead_changes_trigger
  AFTER INSERT OR UPDATE ON public.leads
  FOR EACH ROW 
  EXECUTE FUNCTION public.log_lead_changes();