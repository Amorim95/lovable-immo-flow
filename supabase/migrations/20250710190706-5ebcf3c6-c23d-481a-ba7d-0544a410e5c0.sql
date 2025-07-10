-- Atualizar configurações para criação de corretor
-- Garantir que todas as configurações estejam corretas

-- Verificar se existem usuários com status inconsistente e corrigir
UPDATE public.users 
SET status = 'ativo' 
WHERE role = 'corretor' 
AND status = 'pendente' 
AND created_at < now() - interval '1 hour';

-- Garantir que todos os corretores tenham permissões (criar se não existirem)
INSERT INTO public.permissions (user_id, can_view_all_leads, can_invite_users, can_manage_leads, can_view_reports, can_manage_properties, can_manage_teams, can_access_configurations)
SELECT 
    u.id,
    false, -- can_view_all_leads (removido da interface)
    false, -- can_invite_users
    true,  -- can_manage_leads (permissão básica)
    false, -- can_view_reports
    false, -- can_manage_properties (removido da interface)
    false, -- can_manage_teams
    false  -- can_access_configurations
FROM public.users u
LEFT JOIN public.permissions p ON p.user_id = u.id
WHERE u.role = 'corretor' 
AND p.user_id IS NULL;

-- Criar função helper para validar email
CREATE OR REPLACE FUNCTION public.validate_email(email_input text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- Validação básica de email
  RETURN email_input ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$;