-- Fix infinite recursion in users table RLS policies
-- The issue is that policies are trying to query the users table from within users table policies

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Usuarios mesma empresa podem se ver" ON public.users;

-- Create a safe security definer function to get user's company_id
CREATE OR REPLACE FUNCTION public.get_current_user_company_id()
RETURNS UUID
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

-- Recreate the policy without infinite recursion
CREATE POLICY "Usuarios mesma empresa podem se ver"
ON public.users
FOR SELECT
USING (
  -- Super admins can see all
  auth.uid() = '40257dfa-1a8e-4c15-a8f7-2cb99cfa4f08'::uuid OR
  auth.uid() = '62926fc7-ffba-4a63-9bae-50f8845a1b67'::uuid OR
  -- Users can see themselves
  id = auth.uid() OR
  -- Users can see others in their company (avoiding infinite recursion)
  (company_id IS NOT NULL AND company_id = public.get_current_user_company_id())
);