-- SOLUÇÃO DEFINITIVA: Remover dependências e recriar tudo sem ambiguidade

-- 1. Remover temporariamente as políticas dependentes
DROP POLICY IF EXISTS "Usuários com permissão podem ver todos os leads" ON public.leads;
DROP POLICY IF EXISTS "Usuários com permissão podem atualizar todos os leads" ON public.leads;
DROP POLICY IF EXISTS "Usuários podem ver relacionamentos de leads que têm acesso" ON public.lead_campaign;
DROP POLICY IF EXISTS "Corretores podem ver sua fila" ON public.lead_queue;

-- 2. Remover e recriar as funções sem ambiguidade
DROP FUNCTION IF EXISTS public.can_view_all_leads(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.can_invite_users(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;

-- 3. Recriar função is_admin sem ambiguidade
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

-- 4. Recriar função can_view_all_leads sem ambiguidade
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

-- 5. Recriar função can_invite_users sem ambiguidade
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

-- 6. Recriar as políticas RLS com as funções corrigidas
CREATE POLICY "Usuários com permissão podem ver todos os leads" 
ON public.leads 
FOR SELECT 
USING (can_view_all_leads(auth.uid()));

CREATE POLICY "Usuários com permissão podem atualizar todos os leads" 
ON public.leads 
FOR UPDATE 
USING (can_view_all_leads(auth.uid()));

CREATE POLICY "Usuários podem ver relacionamentos de leads que têm acesso" 
ON public.lead_campaign 
FOR SELECT 
USING (EXISTS ( 
  SELECT 1 FROM leads l 
  WHERE l.id = lead_campaign.lead_id 
  AND (l.user_id = auth.uid() OR can_view_all_leads(auth.uid()))
));

CREATE POLICY "Corretores podem ver sua fila" 
ON public.lead_queue 
FOR SELECT 
USING (assigned_to = auth.uid() OR can_view_all_leads(auth.uid()));