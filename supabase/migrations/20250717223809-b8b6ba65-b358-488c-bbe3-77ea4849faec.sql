-- Criar usuário gestor rhenan644@gmail.com
DO $$
DECLARE
    user_id uuid;
    hashed_password text;
BEGIN
    -- Gerar ID único para o usuário
    user_id := gen_random_uuid();
    
    -- Criptografar a senha
    SELECT crypt('gestor25', gen_salt('bf', 8)) INTO hashed_password;
    
    -- Inserir usuário na tabela public.users
    INSERT INTO public.users (
        id,
        email,
        name,
        password_hash,
        role,
        status,
        created_at,
        updated_at
    ) VALUES (
        user_id,
        'rhenan644@gmail.com',
        'Rhenan Gestor',
        hashed_password,
        'gestor',
        'ativo',
        now(),
        now()
    );
    
    -- Criar usuário no auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        user_id,
        'authenticated',
        'authenticated',
        'rhenan644@gmail.com',
        crypt('gestor25', gen_salt('bf')),
        now(),
        now(),
        now(),
        '',
        '',
        '',
        ''
    );
    
    -- Criar permissões de gestor
    INSERT INTO public.permissions (
        user_id,
        can_view_all_leads,
        can_invite_users,
        can_manage_leads,
        can_view_reports,
        can_access_configurations,
        can_manage_teams,
        can_manage_properties,
        created_at,
        updated_at
    ) VALUES (
        user_id,
        true,
        true,
        true,
        true,
        false,
        true,
        true,
        now(),
        now()
    );
    
    RAISE NOTICE 'Usuário gestor criado com sucesso: %', user_id;
END $$;