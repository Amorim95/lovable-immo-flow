
CREATE POLICY "Admins podem gerenciar webhooks da empresa"
  ON public.company_webhooks
  FOR ALL
  USING (
    company_id = get_user_company_id() 
    AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'dono') 
      AND status = 'ativo'
    )
  )
  WITH CHECK (
    company_id = get_user_company_id() 
    AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'dono') 
      AND status = 'ativo'
    )
  );
