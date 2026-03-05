
CREATE POLICY "Super admins podem ver todas as etapas"
  ON public.lead_stages
  FOR SELECT
  USING (is_super_admin());
