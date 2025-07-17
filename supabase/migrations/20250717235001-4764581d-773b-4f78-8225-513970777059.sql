-- Limpar TODOS os triggers relacionados a leads para evitar conflitos
DROP TRIGGER IF EXISTS add_to_queue_trigger ON public.leads;
DROP TRIGGER IF EXISTS assign_lead_trigger ON public.leads;
DROP TRIGGER IF EXISTS log_lead_changes_trigger ON public.leads;
DROP TRIGGER IF EXISTS simple_lead_assignment ON public.leads;
DROP TRIGGER IF EXISTS trigger_distribute_lead_to_queue ON public.leads;
DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
DROP TRIGGER IF EXISTS validate_immutable_lead_fields_trigger ON public.leads;

-- Criar apenas os triggers essenciais

-- 1. Trigger para atribuir lead ao criador (BEFORE INSERT)
CREATE TRIGGER assign_lead_to_creator_trigger
  BEFORE INSERT ON public.leads
  FOR EACH ROW 
  EXECUTE FUNCTION public.assign_lead_to_creator();

-- 2. Trigger para atualizar timestamp (BEFORE UPDATE) 
CREATE TRIGGER update_leads_updated_at_trigger
  BEFORE UPDATE ON public.leads
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Trigger para adicionar à fila (AFTER INSERT)
CREATE TRIGGER add_lead_to_queue_trigger
  AFTER INSERT ON public.leads
  FOR EACH ROW 
  EXECUTE FUNCTION public.add_lead_to_queue();

-- 4. Trigger para logs (AFTER INSERT/UPDATE)
CREATE TRIGGER log_lead_changes_trigger
  AFTER INSERT OR UPDATE ON public.leads
  FOR EACH ROW 
  EXECUTE FUNCTION public.log_lead_changes();