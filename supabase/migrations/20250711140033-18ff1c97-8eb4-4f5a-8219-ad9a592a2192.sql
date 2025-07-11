-- Criar usuário administrador Amorim com email único
DO $$
DECLARE
    new_user_id uuid := gen_random_uuid();
BEGIN
    -- Inserir na tabela users primeiro
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
        'amorim.admin@crm.com',
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
    
    RAISE NOTICE 'Usuário administrador Amorim criado com ID: %', new_user_id;
END $$;