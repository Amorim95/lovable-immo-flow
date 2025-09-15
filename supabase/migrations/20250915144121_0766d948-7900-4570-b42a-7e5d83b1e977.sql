-- Atualizar função can_view_all_leads para permitir usuários inativos verem tags
CREATE OR REPLACE FUNCTION public.can_view_all_leads(_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.permissions p
    JOIN public.users u ON u.id = p.user_id
    WHERE p.user_id = _user_id 
    AND p.can_view_all_leads = true 
    -- Removida verificação de status para permitir usuários inativos
  ) OR public.is_admin_or_dono(_user_id);
END;
$function$;

-- Atualizar função is_admin_or_dono para permitir admins/donos inativos gerenciarem tags
CREATE OR REPLACE FUNCTION public.is_admin_or_dono(_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = _user_id 
    AND role IN ('admin', 'dono')
    -- Removida verificação de status para permitir usuários inativos
  );
END;
$function$;