-- Criar política RLS para deletar leads
CREATE POLICY "Admins e gestores podem deletar leads da empresa"
ON public.leads
FOR DELETE
USING (
  is_super_admin() OR 
  (
    company_id = get_user_company_id() AND 
    (
      auth.uid() IN (
        SELECT id FROM users 
        WHERE role IN ('admin', 'gestor', 'dono') 
        AND status = 'ativo'
        AND company_id = get_user_company_id()
      )
    )
  )
);