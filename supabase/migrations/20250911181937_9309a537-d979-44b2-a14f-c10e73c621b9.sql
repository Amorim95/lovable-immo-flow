-- Add legacy_key to lead_stages to keep link with default enum stage
ALTER TABLE public.lead_stages ADD COLUMN IF NOT EXISTS legacy_key text;

-- Backfill legacy_key for default stages by name
UPDATE public.lead_stages SET legacy_key = 'aguardando-atendimento' WHERE nome IN ('Aguardando Atendimento');
UPDATE public.lead_stages SET legacy_key = 'tentativas-contato' WHERE nome IN ('Em Tentativas de Contato');
UPDATE public.lead_stages SET legacy_key = 'atendeu' WHERE nome IN ('Atendeu');
UPDATE public.lead_stages SET legacy_key = 'nome-sujo' WHERE nome IN ('Nome Sujo');
UPDATE public.lead_stages SET legacy_key = 'nome-limpo' WHERE nome IN ('Nome Limpo');
UPDATE public.lead_stages SET legacy_key = 'visita' WHERE nome IN ('Visita');
UPDATE public.lead_stages SET legacy_key = 'vendas-fechadas' WHERE nome IN ('Vendas Fechadas');
UPDATE public.lead_stages SET legacy_key = 'em-pausa' WHERE nome IN ('Em Pausa');
UPDATE public.lead_stages SET legacy_key = 'descarte' WHERE nome IN ('Descarte');