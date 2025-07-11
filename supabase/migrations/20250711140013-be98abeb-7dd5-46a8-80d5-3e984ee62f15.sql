-- Criar usuário administrador Amorim
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    confirmation_token,
    role
) VALUES (
    gen_random_uuid(),
    'rhenanamorim230@gmail.com',
    crypt('1212', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"name": "Amorim"}',
    '',
    'authenticated'
);

-- Pegar o ID do usuário criado e inserir na tabela users
DO $$
DECLARE
    auth_user_id uuid;
BEGIN
    -- Buscar o ID do usuário recém criado
    SELECT id INTO auth_user_id 
    FROM auth.users 
    WHERE email = 'rhenanamorim230@gmail.com';
    
    -- Inserir na tabela users
    INSERT INTO public.users (
        id,
        name,
        email,
        password_hash,
        role,
        status
    ) VALUES (
        auth_user_id,
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
        auth_user_id,
        true,
        true,
        true,
        true,
        true,
        true,
        true
    );
    
    RAISE NOTICE 'Usuário administrador Amorim criado com sucesso';
END $$;