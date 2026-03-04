
-- Insert default stages for Wagner Raposo's company
INSERT INTO lead_stages (company_id, nome, cor, ordem, legacy_key, ativo) VALUES
  ('2b0c0f20-fa2f-408b-b369-0cc7e37cd2dd', 'Aguardando Atendimento', '#3B82F6', 1, 'aguardando-atendimento', true),
  ('2b0c0f20-fa2f-408b-b369-0cc7e37cd2dd', 'Tentativas de Contato', '#F59E0B', 2, 'tentativas-contato', true),
  ('2b0c0f20-fa2f-408b-b369-0cc7e37cd2dd', 'Atendeu', '#8B5CF6', 3, 'atendeu', true),
  ('2b0c0f20-fa2f-408b-b369-0cc7e37cd2dd', 'Nome Sujo', '#EF4444', 4, 'nome-sujo', true),
  ('2b0c0f20-fa2f-408b-b369-0cc7e37cd2dd', 'Nome Limpo', '#10B981', 5, 'nome-limpo', true),
  ('2b0c0f20-fa2f-408b-b369-0cc7e37cd2dd', 'Visita', '#EC4899', 6, 'visita', true),
  ('2b0c0f20-fa2f-408b-b369-0cc7e37cd2dd', 'Vendas Fechadas', '#22C55E', 7, 'vendas-fechadas', true),
  ('2b0c0f20-fa2f-408b-b369-0cc7e37cd2dd', 'Em Pausa', '#6B7280', 8, 'em-pausa', true),
  ('2b0c0f20-fa2f-408b-b369-0cc7e37cd2dd', 'Descarte', '#DC2626', 9, 'descarte', true);

-- Create function to auto-insert default stages when a new company is created
CREATE OR REPLACE FUNCTION public.create_default_lead_stages()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO lead_stages (company_id, nome, cor, ordem, legacy_key, ativo) VALUES
    (NEW.id, 'Aguardando Atendimento', '#3B82F6', 1, 'aguardando-atendimento', true),
    (NEW.id, 'Tentativas de Contato', '#F59E0B', 2, 'tentativas-contato', true),
    (NEW.id, 'Atendeu', '#8B5CF6', 3, 'atendeu', true),
    (NEW.id, 'Nome Sujo', '#EF4444', 4, 'nome-sujo', true),
    (NEW.id, 'Nome Limpo', '#10B981', 5, 'nome-limpo', true),
    (NEW.id, 'Visita', '#EC4899', 6, 'visita', true),
    (NEW.id, 'Vendas Fechadas', '#22C55E', 7, 'vendas-fechadas', true),
    (NEW.id, 'Em Pausa', '#6B7280', 8, 'em-pausa', true),
    (NEW.id, 'Descarte', '#DC2626', 9, 'descarte', true);
  RETURN NEW;
END;
$$;

-- Create trigger on companies table
DROP TRIGGER IF EXISTS trigger_create_default_lead_stages ON companies;
CREATE TRIGGER trigger_create_default_lead_stages
  AFTER INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION create_default_lead_stages();
