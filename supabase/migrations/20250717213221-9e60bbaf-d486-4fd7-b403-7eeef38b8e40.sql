-- Limpar dados existentes e criar usuário administrador
DELETE FROM public.lead_queue;
DELETE FROM public.lead_campaign;
DELETE FROM public.logs;
DELETE FROM public.leads;
DELETE FROM public.permissions;
DELETE FROM public.users;
DELETE FROM public.equipes;
DELETE FROM public.campaigns;
DELETE FROM public.invitations;

-- Criar usuário administrador
INSERT INTO public.users (
  id,
  email, 
  name, 
  password_hash, 
  role, 
  status,
  created_at,
  updated_at
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'rhenan644@gmail.com',
  'Administrador',
  public.crypt_password('gestor25'),
  'admin',
  'ativo',
  now(),
  now()
);

-- Criar permissões para o administrador
INSERT INTO public.permissions (
  user_id,
  can_view_all_leads,
  can_invite_users,
  can_manage_leads,
  can_view_reports,
  can_access_configurations,
  can_manage_teams,
  can_manage_properties
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  true,
  true,
  true,
  true,
  true,
  true,
  true
);