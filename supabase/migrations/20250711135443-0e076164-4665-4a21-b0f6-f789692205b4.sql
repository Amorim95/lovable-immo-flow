-- Criar equipe "Tropa da Venda" 
-- Primeiro vamos ver se existe algum usuário admin para ser o responsável
DO $$
DECLARE
    admin_user_id uuid;
    admin_user_name text;
BEGIN
    -- Buscar um usuário admin ativo
    SELECT id, name INTO admin_user_id, admin_user_name 
    FROM public.users 
    WHERE role = 'admin' AND status = 'ativo' 
    LIMIT 1;
    
    -- Se encontrou um admin, criar a equipe
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.equipes (nome, responsavel_id, responsavel_nome)
        VALUES ('Tropa da Venda', admin_user_id, admin_user_name)
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Equipe "Tropa da Venda" criada com responsável: %', admin_user_name;
    ELSE
        -- Se não há admin, criar equipe sem responsável por enquanto
        INSERT INTO public.equipes (nome)
        VALUES ('Tropa da Venda')
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Equipe "Tropa da Venda" criada sem responsável (nenhum admin encontrado)';
    END IF;
END $$;