-- Criar companhia "Click" e migrar todos os dados existentes
-- Primeiro, criar a companhia Click
INSERT INTO public.companies (id, name, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Click',
  now(),
  now()
)
ON CONFLICT DO NOTHING;

-- Obter o ID da companhia Click
DO $$
DECLARE
    click_company_id UUID;
BEGIN
    -- Buscar ou criar a companhia Click
    SELECT id INTO click_company_id FROM public.companies WHERE name = 'Click';
    
    -- Se não existir, criar
    IF click_company_id IS NULL THEN
        INSERT INTO public.companies (name) VALUES ('Click') RETURNING id INTO click_company_id;
    END IF;
    
    -- Atualizar todos os usuários (exceto super admins) para a companhia Click
    UPDATE public.users 
    SET company_id = click_company_id
    WHERE company_id IS NULL 
    AND email NOT IN ('rhenan644@gmail.com', 'chel.94.santos@gmail.com');
    
    -- Atualizar todas as tabelas com company_id para apontar para Click
    -- Leads
    UPDATE public.leads 
    SET company_id = click_company_id
    WHERE company_id IS NULL;
    
    -- Equipes
    UPDATE public.equipes 
    SET company_id = click_company_id
    WHERE company_id IS NULL;
    
    -- Imóveis
    UPDATE public.imoveis 
    SET company_id = click_company_id
    WHERE company_id IS NULL;
    
    -- Logs
    UPDATE public.logs 
    SET company_id = click_company_id
    WHERE company_id IS NULL;
    
    -- Metas
    UPDATE public.metas 
    SET company_id = click_company_id
    WHERE company_id IS NULL;
    
    RAISE NOTICE 'Companhia Click criada com ID: % e todos os dados migrados', click_company_id;
END $$;

-- Garantir que os super admins permaneçam sem company_id
UPDATE public.users 
SET company_id = NULL, role = 'admin'
WHERE email IN ('rhenan644@gmail.com', 'chel.94.santos@gmail.com');