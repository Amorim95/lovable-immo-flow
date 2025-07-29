-- Atualizar senha do usuário rhenan644@gmail.com para gestor25
UPDATE auth.users 
SET encrypted_password = crypt('gestor25', gen_salt('bf'))
WHERE email = 'rhenan644@gmail.com';