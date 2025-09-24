-- Remover todas as políticas SELECT conflitantes
DROP POLICY IF EXISTS "Imoveis habilitados (SELECT)" ON public.imoveis;
DROP POLICY IF EXISTS "Usuarios podem ver imoveis da empresa" ON public.imoveis;

-- Recriar política de acesso para usuários autenticados
CREATE POLICY "Usuarios autenticados podem ver imoveis da empresa" 
ON public.imoveis 
FOR SELECT 
TO authenticated
USING (is_super_admin() OR (company_id = get_user_company_id()));

-- A política pública já existe e deve funcionar para usuários anônimos
-- "Acesso público para imóveis públicos" - publico = true