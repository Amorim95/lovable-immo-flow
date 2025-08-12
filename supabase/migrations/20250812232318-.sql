-- Atribuir todos os imóveis existentes para a empresa CLICK
UPDATE public.imoveis 
SET company_id = 'c95541d9-3e6a-4fc1-8d64-c5a6d5f7c9b6'
WHERE company_id IS NULL OR company_id != 'c95541d9-3e6a-4fc1-8d64-c5a6d5f7c9b6';

-- Verificar se a atualização foi feita corretamente
SELECT 'Imóveis atualizados para a empresa CLICK' as status;