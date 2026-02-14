
-- Fix: include 'dono' role in the SELECT RLS policy for leads
DROP POLICY IF EXISTS "Ver leads baseado no papel do usuario" ON public.leads;

CREATE POLICY "Ver leads baseado no papel do usuario"
ON public.leads
FOR SELECT
USING (
  is_super_admin()
  OR (
    company_id = get_user_company_id()
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'gestor', 'dono')
        AND users.company_id = get_user_company_id()
      )
    )
  )
);

-- Also fix the UPDATE policy to include 'dono'
DROP POLICY IF EXISTS "Editar leads baseado no papel" ON public.leads;

CREATE POLICY "Editar leads baseado no papel"
ON public.leads
FOR UPDATE
USING (
  is_super_admin()
  OR (
    company_id = get_user_company_id()
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'gestor', 'dono')
        AND users.company_id = get_user_company_id()
      )
    )
  )
);
