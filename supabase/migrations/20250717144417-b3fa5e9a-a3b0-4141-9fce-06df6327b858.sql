-- Inserir usuário na tabela auth.users para autenticação
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'c22caedc-d4b3-4e97-bb8a-dd34dabca46d',
    'authenticated',
    'authenticated',
    'rhenanamorim230@gmail.com',
    crypt('gestor25', gen_salt('bf')),
    NOW(),
    NULL,
    NULL,
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO UPDATE SET
    encrypted_password = crypt('gestor25', gen_salt('bf')),
    email = 'rhenanamorim230@gmail.com',
    updated_at = NOW();