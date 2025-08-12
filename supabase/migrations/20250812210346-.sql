-- Primeiro: buscar o ID da empresa "Click Imóveis"
-- E atribuir todos os usuários (exceto super-admins) e dados a essa empresa

-- Buscar company_id da empresa Click
DO $$
DECLARE
    click_company_id UUID;
BEGIN
    -- Buscar ID da empresa Click Imóveis
    SELECT id INTO click_company_id 
    FROM public.companies 
    WHERE name ILIKE '%click%' 
    LIMIT 1;
    
    IF click_company_id IS NOT NULL THEN
        -- Atribuir todos os usuários (exceto super-admins) à empresa Click
        UPDATE public.users 
        SET company_id = click_company_id 
        WHERE email NOT IN ('rhenan644@gmail.com', 'chel.94.santos@gmail.com')
        AND (company_id IS NULL OR company_id != click_company_id);
        
        -- Atribuir todos os leads à empresa Click
        UPDATE public.leads 
        SET company_id = click_company_id 
        WHERE company_id IS NULL OR company_id != click_company_id;
        
        -- Atribuir todos os imóveis à empresa Click
        UPDATE public.imoveis 
        SET company_id = click_company_id 
        WHERE company_id IS NULL OR company_id != click_company_id;
        
        -- Atribuir todas as equipes à empresa Click
        UPDATE public.equipes 
        SET company_id = click_company_id 
        WHERE company_id IS NULL OR company_id != click_company_id;
        
        -- Atribuir todas as metas à empresa Click
        UPDATE public.metas 
        SET company_id = click_company_id 
        WHERE company_id IS NULL OR company_id != click_company_id;
        
        -- Atribuir todos os logs à empresa Click
        UPDATE public.logs 
        SET company_id = click_company_id 
        WHERE company_id IS NULL OR company_id != click_company_id;
        
        RAISE NOTICE 'Dados atribuídos à empresa Click com ID: %', click_company_id;
    ELSE
        RAISE NOTICE 'Empresa Click não encontrada';
    END IF;
END $$;