-- Limpar usuário de teste e criar administrador principal
DELETE FROM public.users WHERE email = 'rhenanamorim230@gmail.com';

DO $$
DECLARE
    new_user_id uuid := gen_random_uuid();
BEGIN
    -- Inserir usuário administrador principal
    INSERT INTO public.users (id, name, email, password_hash, role, status)
    VALUES (new_user_id, 'Amorim Gestão', 'rhenanamorim230@gmail.com', crypt('gestor25', gen_salt('bf')), 'admin', 'ativo');

    -- Inserir permissões completas para o administrador
    INSERT INTO public.permissions (user_id, can_view_all_leads, can_invite_users, can_manage_leads, can_view_reports, can_manage_properties, can_manage_teams, can_access_configurations)
    VALUES (new_user_id, true, true, true, true, true, true, true);

END $$;