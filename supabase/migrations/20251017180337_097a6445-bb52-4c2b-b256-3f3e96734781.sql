-- Corrigir ID da usuária Juliana para sincronizar com auth.users
-- Isso manterá o login, senha e todos os dados históricos

BEGIN;

-- Desabilitar triggers temporariamente para permitir atualização de PKs
SET session_replication_role = 'replica';

-- Atualizar todas as referências ao user_id antigo nas tabelas relacionadas
UPDATE public.leads 
SET user_id = '85adfb1b-8c1e-435a-9baa-d035063d6f71'
WHERE user_id = '020176ca-8bf5-45c8-b890-2781c779d345';

UPDATE public.logs 
SET user_id = '85adfb1b-8c1e-435a-9baa-d035063d6f71'
WHERE user_id = '020176ca-8bf5-45c8-b890-2781c779d345';

UPDATE public.permissions 
SET user_id = '85adfb1b-8c1e-435a-9baa-d035063d6f71'
WHERE user_id = '020176ca-8bf5-45c8-b890-2781c779d345';

UPDATE public.push_subscriptions 
SET user_id = '85adfb1b-8c1e-435a-9baa-d035063d6f71'
WHERE user_id = '020176ca-8bf5-45c8-b890-2781c779d345';

UPDATE public.equipes 
SET responsavel_id = '85adfb1b-8c1e-435a-9baa-d035063d6f71'
WHERE responsavel_id = '020176ca-8bf5-45c8-b890-2781c779d345';

UPDATE public.lead_queue 
SET assigned_to = '85adfb1b-8c1e-435a-9baa-d035063d6f71'
WHERE assigned_to = '020176ca-8bf5-45c8-b890-2781c779d345';

UPDATE public.metas 
SET referencia_id = '85adfb1b-8c1e-435a-9baa-d035063d6f71'
WHERE referencia_id = '020176ca-8bf5-45c8-b890-2781c779d345'
AND tipo = 'corretor';

-- Atualizar o ID principal do usuário e ativar
UPDATE public.users 
SET id = '85adfb1b-8c1e-435a-9baa-d035063d6f71',
    status = 'ativo'
WHERE id = '020176ca-8bf5-45c8-b890-2781c779d345';

-- Reabilitar triggers
SET session_replication_role = 'origin';

COMMIT;