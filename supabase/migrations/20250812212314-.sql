-- Criar nova permissão de super admin
-- Adicionar coluna is_super_admin na tabela permissions
ALTER TABLE public.permissions ADD COLUMN IF NOT EXISTS is_super_admin boolean NOT NULL DEFAULT false;

-- Atualizar os usuários específicos para terem permissão de super admin
-- Primeiro, inserir permissões se não existirem
INSERT INTO public.permissions (user_id, is_super_admin, can_invite_users, can_manage_leads, can_view_reports, can_manage_teams, can_access_configurations)
SELECT '40257dfa-1a8e-4c15-a8f7-2cb99cfa4f08'::uuid, true, true, true, true, true, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.permissions WHERE user_id = '40257dfa-1a8e-4c15-a8f7-2cb99cfa4f08'::uuid
);

INSERT INTO public.permissions (user_id, is_super_admin, can_invite_users, can_manage_leads, can_view_reports, can_manage_teams, can_access_configurations)
SELECT '62926fc7-ffba-4a63-9bae-50f8845a1b67'::uuid, true, true, true, true, true, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.permissions WHERE user_id = '62926fc7-ffba-4a63-9bae-50f8845a1b67'::uuid
);

-- Atualizar permissões existentes se já existirem
UPDATE public.permissions 
SET is_super_admin = true, 
    can_invite_users = true, 
    can_manage_leads = true, 
    can_view_reports = true, 
    can_manage_teams = true, 
    can_access_configurations = true
WHERE user_id IN ('40257dfa-1a8e-4c15-a8f7-2cb99cfa4f08'::uuid, '62926fc7-ffba-4a63-9bae-50f8845a1b67'::uuid);