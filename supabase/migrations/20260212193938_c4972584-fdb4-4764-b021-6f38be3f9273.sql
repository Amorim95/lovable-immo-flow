
-- Adicionar coluna stage_order para controlar posição do lead dentro da coluna do Kanban
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS stage_order BIGINT DEFAULT 0;

-- Criar índice para ordenação eficiente por stage_name + stage_order
CREATE INDEX IF NOT EXISTS idx_leads_stage_order ON public.leads (stage_name, stage_order);

-- Popula valores iniciais baseado em created_at para cada stage_name
-- Leads mais antigos ficam com ordem menor (aparecem primeiro)
WITH ordered_leads AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY stage_name ORDER BY created_at ASC) * 1000 AS new_order
  FROM public.leads
)
UPDATE public.leads
SET stage_order = ordered_leads.new_order
FROM ordered_leads
WHERE leads.id = ordered_leads.id;
