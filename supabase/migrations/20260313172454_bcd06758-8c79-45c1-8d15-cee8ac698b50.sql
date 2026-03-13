
DROP POLICY "Admins podem gerenciar webhooks da empresa" ON public.company_webhooks;

CREATE POLICY "Admins podem gerenciar webhooks da empresa"
ON public.company_webhooks
FOR ALL
TO public
USING (
  (company_id = get_user_company_id()) AND 
  (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'dono')
    AND users.company_id = get_user_company_id()
  ))
)
WITH CHECK (
  (company_id = get_user_company_id()) AND 
  (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'dono')
    AND users.company_id = get_user_company_id()
  ))
);
