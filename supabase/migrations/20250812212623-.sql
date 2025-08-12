-- Atribuir permissão de super admin aos emails específicos
-- Inserir ou atualizar permissões para os emails solicitados

-- Para chel.94.santos@gmail.com
INSERT INTO public.permissions (
  user_id, 
  is_super_admin, 
  can_invite_users, 
  can_manage_leads, 
  can_view_reports, 
  can_manage_teams, 
  can_access_configurations
)
SELECT 
  u.id, 
  true, 
  true, 
  true, 
  true, 
  true, 
  true
FROM public.users u
WHERE u.email = 'chel.94.santos@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM public.permissions p WHERE p.user_id = u.id
);

-- Atualizar permissões existentes para chel.94.santos@gmail.com
UPDATE public.permissions 
SET 
  is_super_admin = true, 
  can_invite_users = true, 
  can_manage_leads = true, 
  can_view_reports = true, 
  can_manage_teams = true, 
  can_access_configurations = true,
  updated_at = now()
WHERE user_id IN (
  SELECT id FROM public.users WHERE email = 'chel.94.santos@gmail.com'
);

-- Para rhenan644@gmail.com
INSERT INTO public.permissions (
  user_id, 
  is_super_admin, 
  can_invite_users, 
  can_manage_leads, 
  can_view_reports, 
  can_manage_teams, 
  can_access_configurations
)
SELECT 
  u.id, 
  true, 
  true, 
  true, 
  true, 
  true, 
  true
FROM public.users u
WHERE u.email = 'rhenan644@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM public.permissions p WHERE p.user_id = u.id
);

-- Atualizar permissões existentes para rhenan644@gmail.com
UPDATE public.permissions 
SET 
  is_super_admin = true, 
  can_invite_users = true, 
  can_manage_leads = true, 
  can_view_reports = true, 
  can_manage_teams = true, 
  can_access_configurations = true,
  updated_at = now()
WHERE user_id IN (
  SELECT id FROM public.users WHERE email = 'rhenan644@gmail.com'
);