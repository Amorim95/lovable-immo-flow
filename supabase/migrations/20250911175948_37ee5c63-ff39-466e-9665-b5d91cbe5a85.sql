-- Migrar leads existentes para usar stage_name baseado no mapeamento
UPDATE public.leads 
SET stage_name = CASE 
  WHEN etapa = 'aguardando-atendimento' THEN 'Aguardando Atendimento'
  WHEN etapa = 'tentativas-contato' THEN 'Em Tentativas de Contato'
  WHEN etapa = 'atendeu' THEN 'Atendeu'
  WHEN etapa = 'nome-sujo' THEN 'Nome Sujo'
  WHEN etapa = 'nome-limpo' THEN 'Nome Limpo'
  WHEN etapa = 'visita' THEN 'Visita'
  WHEN etapa = 'vendas-fechadas' THEN 'Vendas Fechadas'
  WHEN etapa = 'em-pausa' THEN 'Em Pausa'
  WHEN etapa = 'descarte' THEN 'Descarte'
  ELSE 'Aguardando Atendimento'
END
WHERE stage_name IS NULL;