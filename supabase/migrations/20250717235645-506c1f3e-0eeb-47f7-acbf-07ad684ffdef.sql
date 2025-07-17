-- Remover e recriar as funções sem ambiguidade
DROP FUNCTION IF EXISTS public.can_view_all_leads(uuid);
DROP FUNCTION IF EXISTS public.can_invite_users(uuid);  
DROP FUNCTION IF EXISTS public.is_admin(uuid);

-- Recriar função is_admin sem ambiguidade
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = _user_id AND role = 'admin' AND status = 'ativo'
  );
END;
$function$;

-- Recriar função can_view_all_leads sem ambiguidade
CREATE OR REPLACE FUNCTION public.can_view_all_leads(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.permissions p
    JOIN public.users u ON u.id = p.user_id
    WHERE p.user_id = _user_id 
    AND p.can_view_all_leads = true 
    AND u.status = 'ativo'
  ) OR public.is_admin(_user_id);
END;
$function$;

-- Recriar função can_invite_users sem ambiguidade
CREATE OR REPLACE FUNCTION public.can_invite_users(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.permissions p
    JOIN public.users u ON u.id = p.user_id
    WHERE p.user_id = _user_id 
    AND p.can_invite_users = true 
    AND u.status = 'ativo'
  ) OR public.is_admin(_user_id);
END;
$function$;