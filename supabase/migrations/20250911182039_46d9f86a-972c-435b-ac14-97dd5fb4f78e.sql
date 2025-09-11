-- Fix renaming issue: update legacy_key for renamed stages
UPDATE public.lead_stages 
SET legacy_key = 'aguardando-atendimento' 
WHERE nome LIKE 'Aguardando%' AND legacy_key IS NULL;

-- Also set legacy_key for stages that were recently renamed from the defaults
UPDATE public.lead_stages 
SET legacy_key = 
  CASE 
    WHEN nome LIKE 'Aguardando%' THEN 'aguardando-atendimento'
    WHEN nome LIKE '%Tentativas%' THEN 'tentativas-contato'
    WHEN nome LIKE 'Atendeu%' THEN 'atendeu'
    WHEN nome LIKE '%Sujo%' THEN 'nome-sujo'
    WHEN nome LIKE '%Limpo%' THEN 'nome-limpo'
    WHEN nome LIKE 'Visita%' THEN 'visita'
    WHEN nome LIKE '%Fechadas%' OR nome LIKE '%Vendas%' THEN 'vendas-fechadas'
    WHEN nome LIKE '%Pausa%' THEN 'em-pausa'
    WHEN nome LIKE 'Descarte%' THEN 'descarte'
  END
WHERE legacy_key IS NULL;