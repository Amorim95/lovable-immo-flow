-- Inserir usuário de teste temporário
INSERT INTO public.users (name, email, password_hash, role, status) 
VALUES (
  'Administrador Teste',
  'rhenan644@gmail.com',
  '$2a$10$8K1p/a0dSTANz4dqKHD.au6T0xgP1qLPKhGnE.K7s9Y9.4wX1t9bO', -- hash para senha "1234"
  'admin',
  'ativo'
);

-- Inserir permissões para o usuário de teste
INSERT INTO public.permissions (user_id, can_invite_users, can_view_all_leads)
SELECT id, true, true 
FROM public.users 
WHERE email = 'rhenan644@gmail.com';

-- Função para hash de senha (bcrypt)
CREATE OR REPLACE FUNCTION public.crypt_password(password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf'));
END;
$$;

-- Função para verificar senha
CREATE OR REPLACE FUNCTION public.verify_password(password text, hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN hash = crypt(password, hash);
END;
$$;