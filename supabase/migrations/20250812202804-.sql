-- Atualizar usuários específicos para serem super administradores
UPDATE public.users 
SET 
  company_id = NULL,
  role = 'admin',
  status = 'ativo'
WHERE email IN ('rhenan644@gmail.com', 'chel.94.santos@gmail.com');

-- Verificar se os usuários existem e criar permissões se necessário
DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Para cada email especificado
    FOR user_record IN 
        SELECT id FROM public.users 
        WHERE email IN ('rhenan644@gmail.com', 'chel.94.santos@gmail.com')
    LOOP
        -- Deletar permissões existentes se houver
        DELETE FROM public.permissions WHERE user_id = user_record.id;
        
        -- Criar permissões de super admin
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
            user_record.id,
            true,
            true,
            true,
            true,
            true,
            true,
            true
        );
    END LOOP;
END $$;