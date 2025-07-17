-- Verificar se o trigger existe e aplicá-lo à tabela leads
DROP TRIGGER IF EXISTS trigger_distribute_lead_to_queue ON public.leads;

CREATE TRIGGER trigger_distribute_lead_to_queue
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.distribute_lead_to_queue();