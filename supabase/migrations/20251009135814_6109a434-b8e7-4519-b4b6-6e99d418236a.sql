-- Corrigir search_path das funções criadas na migration anterior

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = _user_id AND role = 'admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_dono(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = _user_id 
    AND role IN ('admin', 'dono')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.can_view_all_leads(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.permissions p
    JOIN public.users u ON u.id = p.user_id
    WHERE p.user_id = _user_id 
    AND p.can_view_all_leads = true
  ) OR public.is_admin_or_dono(_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.can_invite_users(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.permissions p
    JOIN public.users u ON u.id = p.user_id
    WHERE p.user_id = _user_id 
    AND p.can_invite_users = true
  ) OR public.is_admin_or_dono(_user_id);
END;
$$;