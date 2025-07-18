-- Criar tabela para armazenar tags/etiquetas
CREATE TABLE public.lead_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL UNIQUE,
  cor text DEFAULT '#3B82F6',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Inserir tags pré-definidas
INSERT INTO public.lead_tags (nome, cor) VALUES 
  ('tentando-financiamento', '#F59E0B'),
  ('parou-responder', '#EF4444'),
  ('cpf-restricao', '#8B5CF6');

-- Criar tabela de relacionamento entre leads e tags
CREATE TABLE public.lead_tag_relations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.lead_tags(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(lead_id, tag_id)
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.lead_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_tag_relations ENABLE ROW LEVEL SECURITY;

-- Políticas para lead_tags (usuários ativos podem ver todas as tags)
CREATE POLICY "Usuários ativos podem ver tags" 
ON public.lead_tags 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE users.id = auth.uid() AND users.status = 'ativo'
));

-- Políticas para lead_tag_relations
CREATE POLICY "Usuários podem ver relações de tags de seus leads" 
ON public.lead_tag_relations 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM leads l 
  WHERE l.id = lead_tag_relations.lead_id 
  AND (l.user_id = auth.uid() OR can_view_all_leads(auth.uid()))
));

CREATE POLICY "Usuários podem inserir tags em seus leads" 
ON public.lead_tag_relations 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM leads l 
  WHERE l.id = lead_tag_relations.lead_id 
  AND (l.user_id = auth.uid() OR can_view_all_leads(auth.uid()))
));

CREATE POLICY "Usuários podem deletar tags de seus leads" 
ON public.lead_tag_relations 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM leads l 
  WHERE l.id = lead_tag_relations.lead_id 
  AND (l.user_id = auth.uid() OR can_view_all_leads(auth.uid()))
));

-- Trigger para atualizar timestamp
CREATE TRIGGER update_lead_tags_updated_at
BEFORE UPDATE ON public.lead_tags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();