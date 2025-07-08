-- Habilitar extensão de criptografia
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Recriar função de hash de senha usando pgcrypto
CREATE OR REPLACE FUNCTION public.crypt_password(password text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT crypt(password, gen_salt('bf', 8));
$$;

-- Atualizar a senha do usuário de teste para usar o hash correto
UPDATE public.users 
SET password_hash = public.crypt_password('1234')
WHERE email = 'rhenan644@gmail.com';