-- Inserir identidade para o usuário sem email gerado
INSERT INTO auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
) VALUES (
    'c22caedc-d4b3-4e97-bb8a-dd34dabca46d',
    'c22caedc-d4b3-4e97-bb8a-dd34dabca46d',
    '{"sub":"c22caedc-d4b3-4e97-bb8a-dd34dabca46d","email":"rhenanamorim230@gmail.com","email_verified":false,"phone_verified":false}',
    'email',
    NOW(),
    NOW(),
    NOW()
);