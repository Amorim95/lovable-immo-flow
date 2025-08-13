-- Corrigir leads órfãos sem company_id
-- Atualizar company_id dos leads baseado no company_id do usuário atribuído
UPDATE leads 
SET company_id = u.company_id 
FROM users u 
WHERE leads.user_id = u.id 
AND leads.company_id IS NULL 
AND u.company_id IS NOT NULL;