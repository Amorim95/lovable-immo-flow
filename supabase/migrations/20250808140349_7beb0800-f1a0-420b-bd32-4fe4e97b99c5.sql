-- Criar trigger para atribuição round-robin de leads
CREATE OR REPLACE TRIGGER assign_lead_round_robin_trigger
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_lead_round_robin();