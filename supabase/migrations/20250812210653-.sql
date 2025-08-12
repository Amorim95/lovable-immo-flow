-- Verificar e corrigir especificamente a função get_user_company_id que pode estar causando recursão
-- Vamos criar uma versão mais segura dessa função

CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    -- Super-admins sempre retornam NULL
    WHEN auth.uid() = '40257dfa-1a8e-4c15-a8f7-2cb99cfa4f08'::uuid THEN NULL
    WHEN auth.uid() = '62926fc7-ffba-4a63-9bae-50f8845a1b67'::uuid THEN NULL
    -- Usuários normais retornam seu company_id
    ELSE (
      SELECT company_id 
      FROM public.users 
      WHERE id = auth.uid() 
      LIMIT 1
    )
  END;
$$;

-- Recriar função is_super_admin mais simples também
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() = '40257dfa-1a8e-4c15-a8f7-2cb99cfa4f08'::uuid OR 
         auth.uid() = '62926fc7-ffba-4a63-9bae-50f8845a1b67'::uuid;
$$;