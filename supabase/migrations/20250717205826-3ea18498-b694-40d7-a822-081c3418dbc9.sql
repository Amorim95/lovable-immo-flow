-- Primeiro, obter o ID do usuário que criamos
DO $$
DECLARE
    user_uuid uuid;
BEGIN
    -- Buscar o ID do usuário criado
    SELECT id INTO user_uuid FROM public.users WHERE email = 'rhenan644@gmail.com';
    
    -- Inserir o usuário no auth.users usando o mesmo ID
    -- Nota: Isso deve ser feito via função administrativa
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        role,
        aud,
        confirmation_token,
        email_change_token_new,
        email_change_token_current,
        email_change_confirm_status,
        banned_until,
        email_change,
        phone_change_token,
        phone_change,
        email_change_sent_at,
        phone_change_sent_at,
        phone_confirmed_at,
        phone,
        confirmed_at,
        invited_at,
        last_sign_in_at,
        recovery_sent_at,
        new_email,
        new_phone
    ) VALUES (
        user_uuid,
        '00000000-0000-0000-0000-000000000000',
        'rhenan644@gmail.com',
        crypt('gestor25', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        '{"name": "Administrador"}',
        false,
        'authenticated',
        'authenticated',
        '',
        '',
        '',
        0,
        null,
        '',
        '',
        '',
        null,
        null,
        null,
        null,
        now(),
        null,
        null,
        null,
        null,
        null
    );
END $$;