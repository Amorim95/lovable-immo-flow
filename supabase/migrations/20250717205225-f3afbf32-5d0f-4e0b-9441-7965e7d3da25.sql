-- Limpar todos os dados e criar usuário administrador (versão final)

-- 1. Deletar todos os registros relacionados na ordem correta
DELETE FROM public.lead_queue;
DELETE FROM public.lead_campaign;  
DELETE FROM public.leads;
DELETE FROM public.logs;
DELETE FROM public.permissions;

-- 2. Remover referências de equipe dos usuários primeiro
UPDATE public.users SET equipe_id = NULL;
UPDATE public.equipes SET responsavel_id = NULL;

-- 3. Agora deletar equipes e usuários
DELETE FROM public.equipes;
DELETE FROM public.users;

-- 4. Criar o usuário administrador
INSERT INTO public.users (
  id,
  email,
  name,
  password_hash,
  role,
  status,
  telefone,
  equipe_id
) VALUES (
  gen_random_uuid(),
  'rhenan644@gmail.com',
  'Administrador',
  crypt_password('gestor25'),
  'admin',
  'ativo',
  NULL,
  NULL
);

-- 5. Criar permissões completas para o administrador
INSERT INTO public.permissions (
  user_id,
  can_view_all_leads,
  can_invite_users,
  can_manage_leads,
  can_view_reports,
  can_access_configurations,
  can_manage_teams,
  can_manage_properties
) 
SELECT 
  u.id,
  true,
  true,
  true,
  true,
  true,
  true,
  true
FROM public.users u 
WHERE u.email = 'rhenan644@gmail.com';