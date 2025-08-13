-- Permitir que usuários Dono e Admin possam atualizar os dados da sua empresa
CREATE POLICY "Donos e admins podem atualizar sua empresa"
ON public.companies
FOR UPDATE
TO public
USING (
  id = get_user_company_id() AND 
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() 
    AND u.company_id = companies.id 
    AND u.role IN ('dono', 'admin') 
    AND u.status = 'ativo'
  )
);