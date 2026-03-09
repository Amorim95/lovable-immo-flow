
DROP POLICY IF EXISTS "Admins podem gerenciar etapas da empresa" ON public.lead_stages;

CREATE POLICY "Admins podem gerenciar etapas da empresa"
ON public.lead_stages
FOR ALL
TO public
USING (
  (company_id = get_user_company_id()) AND (
    (auth.uid() IN (
      SELECT users.id FROM users
      WHERE users.role = 'admin'::user_role
        AND users.company_id = get_user_company_id()
    )) OR is_super_admin()
  )
)
WITH CHECK (
  (company_id = get_user_company_id()) AND (
    (auth.uid() IN (
      SELECT users.id FROM users
      WHERE users.role = 'admin'::user_role
        AND users.company_id = get_user_company_id()
    )) OR is_super_admin()
  )
);
