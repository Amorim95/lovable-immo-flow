-- Inserir identidade para o usuário (sem ON CONFLICT)
INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
) VALUES (
    'c22caedc-d4b3-4e97-bb8a-dd34dabca46d',
    'c22caedc-d4b3-4e97-bb8a-dd34dabca46d',
    '{"sub":"c22caedc-d4b3-4e97-bb8a-dd34dabca46d","email":"rhenanamorim230@gmail.com"}',
    'email',
    NOW(),
    NOW(),
    NOW()
);