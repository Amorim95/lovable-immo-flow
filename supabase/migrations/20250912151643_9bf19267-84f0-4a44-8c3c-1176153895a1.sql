-- Remove as etiquetas antigas que não são mais necessárias
DELETE FROM lead_tags 
WHERE nome IN ('aprovado', 'cpf-restricao', 'parou-responder', 'tentando-financiamento');