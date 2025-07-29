-- Critical Security Fix 1: Prevent privilege escalation - users cannot update their own roles
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar seu próprio perfil" ON public.users;

CREATE POLICY "Usuários podem atualizar seu perfil (exceto role)" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND (OLD.role = NEW.role OR NEW.role IS NULL) -- Prevent role changes by users themselves
);

-- Critical Security Fix 2: Enable RLS on consult_base table and add proper policies
ALTER TABLE public.consult_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver todos os dados da base de consulta" 
ON public.consult_base 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND status = 'ativo'
  )
);

CREATE POLICY "Sistema pode inserir dados na base de consulta" 
ON public.consult_base 
FOR INSERT 
WITH CHECK (true); -- Allow system inserts but restrict reads

-- Critical Security Fix 3: Remove overly permissive public access policies
DROP POLICY IF EXISTS "Public access to users" ON public.users;
DROP POLICY IF EXISTS "Public access to equipes" ON public.equipes;
DROP POLICY IF EXISTS "Public access to permissions" ON public.permissions;

-- Recreate more restrictive policies for users table
CREATE POLICY "Usuários ativos podem ver outros usuários da mesma equipe" 
ON public.users 
FOR SELECT 
USING (
  -- Users can see themselves
  (id = auth.uid()) 
  OR
  -- Admins can see all users
  (EXISTS (
    SELECT 1 FROM public.users current_user 
    WHERE current_user.id = auth.uid() 
    AND current_user.role = 'admin' 
    AND current_user.status = 'ativo'
  ))
  OR
  -- Gestors can see users in their team
  (EXISTS (
    SELECT 1 FROM public.users current_user 
    WHERE current_user.id = auth.uid() 
    AND current_user.role = 'gestor' 
    AND current_user.status = 'ativo'
    AND current_user.equipe_id = users.equipe_id
    AND current_user.equipe_id IS NOT NULL
  ))
);

-- More restrictive policy for equipes
CREATE POLICY "Usuários ativos podem ver equipes" 
ON public.equipes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND status = 'ativo'
  )
);

-- More restrictive policy for permissions
CREATE POLICY "Admins podem ver todas as permissões" 
ON public.permissions 
FOR SELECT 
USING (
  (user_id = auth.uid()) -- Users can see their own permissions
  OR 
  (EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND status = 'ativo'
  )) -- Admins can see all permissions
);

-- Security Fix 4: Add role change audit function
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log role changes
  IF OLD.role != NEW.role THEN
    INSERT INTO public.logs (user_id, action, entity, entity_id, details)
    VALUES (
      auth.uid(),
      'Role alterado de ' || OLD.role || ' para ' || NEW.role,
      'user',
      NEW.id,
      jsonb_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role,
        'changed_by', auth.uid(),
        'target_user', NEW.id
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for role change auditing
DROP TRIGGER IF EXISTS audit_user_role_changes ON public.users;
CREATE TRIGGER audit_user_role_changes
  AFTER UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_role_changes();

-- Security Fix 5: Strengthen password validation function
CREATE OR REPLACE FUNCTION public.validate_strong_password(password_input text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- Password must be at least 8 characters
  IF length(password_input) < 8 THEN
    RETURN false;
  END IF;
  
  -- Must contain at least one uppercase letter
  IF password_input !~ '[A-Z]' THEN
    RETURN false;
  END IF;
  
  -- Must contain at least one lowercase letter  
  IF password_input !~ '[a-z]' THEN
    RETURN false;
  END IF;
  
  -- Must contain at least one number
  IF password_input !~ '[0-9]' THEN
    RETURN false;
  END IF;
  
  -- Must contain at least one special character
  IF password_input !~ '[!@#$%^&*(),.?":{}|<>]' THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;