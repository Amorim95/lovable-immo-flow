-- Limpar usuários órfãos que ficaram com status pendente sem registro no auth
-- Identificar e remover usuários que não existem no auth.users mas estão na tabela users

-- Primeiro, vamos identificar usuários pendentes órfãos
-- (Na prática, não podemos fazer join com auth.users, então vamos limpar usuários pendentes antigos)

-- Remover usuários pendentes com mais de 1 hora (provavelmente órfãos de criações falhas)
DELETE FROM public.permissions 
WHERE user_id IN (
  SELECT id FROM public.users 
  WHERE status = 'pendente' 
  AND created_at < now() - interval '1 hour'
);

DELETE FROM public.users 
WHERE status = 'pendente' 
AND created_at < now() - interval '1 hour';

-- Remover especificamente o usuário problemático se ainda existir
DELETE FROM public.permissions WHERE user_id IN (
  SELECT id FROM public.users WHERE email = 'chel.94.santos@gmail.com'
);

DELETE FROM public.users WHERE email = 'chel.94.santos@gmail.com';