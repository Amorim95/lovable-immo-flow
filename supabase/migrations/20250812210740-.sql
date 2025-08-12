-- Verificação final e validação do sistema
-- Vamos garantir que todas as políticas estão corretas e funcionais

-- Verificar se todos os usuários não super-admin têm company_id
SELECT 
  'Usuários sem empresa (exceto super-admins)' as check_type,
  COUNT(*) as count
FROM public.users 
WHERE company_id IS NULL 
AND email NOT IN ('rhenan644@gmail.com', 'chel.94.santos@gmail.com');

-- Verificar se super-admins têm company_id NULL
SELECT 
  'Super-admins com company_id NULL' as check_type,
  COUNT(*) as count
FROM public.users 
WHERE company_id IS NULL 
AND email IN ('rhenan644@gmail.com', 'chel.94.santos@gmail.com');

-- Contar usuários por papel
SELECT 
  role,
  COUNT(*) as count
FROM public.users 
GROUP BY role
ORDER BY count DESC;