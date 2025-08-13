-- Inserir usuário Chel como super admin
INSERT INTO public.users (
  id,
  email,
  name,
  password_hash,
  role,
  status,
  company_id
) VALUES (
  '40257dfa-1a8e-4c15-a8f7-2cb99cfa4f08',
  'chel.94.santos@gmail.com',
  'Chel Santos',
  crypt('mudar123', gen_salt('bf', 8)),
  'admin',
  'ativo',
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- Inserir permissões de super admin para Chel
INSERT INTO public.permissions (
  user_id,
  is_super_admin,
  can_invite_users,
  can_view_all_leads,
  can_manage_leads,
  can_manage_properties,
  can_manage_teams,
  can_view_reports,
  can_access_configurations
) VALUES (
  '40257dfa-1a8e-4c15-a8f7-2cb99cfa4f08',
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true
)
ON CONFLICT (user_id) DO UPDATE SET
  is_super_admin = EXCLUDED.is_super_admin,
  can_invite_users = EXCLUDED.can_invite_users,
  can_view_all_leads = EXCLUDED.can_view_all_leads,
  can_manage_leads = EXCLUDED.can_manage_leads,
  can_manage_properties = EXCLUDED.can_manage_properties,
  can_manage_teams = EXCLUDED.can_manage_teams,
  can_view_reports = EXCLUDED.can_view_reports,
  can_access_configurations = EXCLUDED.can_access_configurations;