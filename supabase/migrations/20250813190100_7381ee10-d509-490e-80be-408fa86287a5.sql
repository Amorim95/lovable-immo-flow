-- Recriar o trigger para atribuição automática de leads
DROP TRIGGER IF EXISTS leads_assign_user_trigger ON public.leads;

CREATE TRIGGER leads_assign_user_trigger
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_lead_unified();