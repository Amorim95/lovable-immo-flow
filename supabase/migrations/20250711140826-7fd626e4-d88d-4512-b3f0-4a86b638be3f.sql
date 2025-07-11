-- Deletar o usuário incorreto e criar o Amorim com os dados corretos
DELETE FROM public.permissions WHERE user_id IN (SELECT id FROM public.users WHERE email = 'amorim.admin@crm.com');
DELETE FROM public.users WHERE email = 'amorim.admin@crm.com';

-- Criar o usuário Amorim com os dados corretos
DO $$
DECLARE
    new_user_id uuid := gen_random_uuid();
BEGIN
    -- Inserir na tabela users
    INSERT INTO public.users (
        id,
        name,
        email,
        password_hash,
        role,
        status
    ) VALUES (
        new_user_id,
        'Amorim',
        'rhenanamorim230@gmail.com',
        'supabase_managed',
        'admin',
        'ativo'
    );
    
    -- Criar permissões de admin
    INSERT INTO public.permissions (
        user_id,
        can_view_all_leads,
        can_invite_users,
        can_manage_leads,
        can_view_reports,
        can_manage_properties,
        can_manage_teams,
        can_access_configurations
    ) VALUES (
        new_user_id,
        true,
        true,
        true,
        true,
        true,
        true,
        true
    );
    
    RAISE NOTICE 'Usuário Amorim criado corretamente com email: rhenanamorim230@gmail.com';
END $$;