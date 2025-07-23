-- Corrigir políticas RLS para permitir que usuários inativos alterem tags dos seus leads

-- Remover políticas atuais da tabela lead_tag_relations
DROP POLICY IF EXISTS "Usuários podem ver relações de tags de seus leads" ON public.lead_tag_relations;
DROP POLICY IF EXISTS "Usuários podem inserir tags em seus leads" ON public.lead_tag_relations;
DROP POLICY IF EXISTS "Usuários podem deletar tags de seus leads" ON public.lead_tag_relations;

-- Criar novas políticas que não dependem do status do usuário para seus próprios leads
CREATE POLICY "Usuários podem ver tags de seus leads" 
ON public.lead_tag_relations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM leads l 
    WHERE l.id = lead_tag_relations.lead_id 
    AND l.user_id = auth.uid()
  ) 
  OR can_view_all_leads(auth.uid())
);

CREATE POLICY "Usuários podem inserir tags em seus leads" 
ON public.lead_tag_relations 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM leads l 
    WHERE l.id = lead_tag_relations.lead_id 
    AND l.user_id = auth.uid()
  ) 
  OR can_view_all_leads(auth.uid())
);

CREATE POLICY "Usuários podem deletar tags de seus leads" 
ON public.lead_tag_relations 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM leads l 
    WHERE l.id = lead_tag_relations.lead_id 
    AND l.user_id = auth.uid()
  ) 
  OR can_view_all_leads(auth.uid())
);