-- Atualizar função is_super_admin para verificar apenas os emails específicos
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND email IN ('rhenan644@gmail.com', 'chel.94.santos@gmail.com')
  );
$function$