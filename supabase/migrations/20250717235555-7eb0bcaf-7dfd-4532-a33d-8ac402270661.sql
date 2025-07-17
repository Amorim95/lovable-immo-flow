-- CORREÇÃO FINAL: Corrigir TODAS as funções com ambiguidade de user_id

-- Corrigir função can_view_all_leads
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

-- Corrigir função can_invite_users  
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

-- Corrigir função is_admin
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