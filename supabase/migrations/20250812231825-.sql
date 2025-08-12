-- Adicionar company_id à tabela company_settings se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'company_id') THEN
        ALTER TABLE public.company_settings ADD COLUMN company_id UUID;
    END IF;
END $$;

-- Atualizar registros existentes para associar à empresa correta
-- Primeiro, vamos criar um mapeamento baseado no email do usuário admin
UPDATE public.company_settings 
SET company_id = (
    SELECT u.company_id 
    FROM public.users u 
    WHERE u.role = 'admin' 
    AND u.email = company_settings.site_email
    AND u.status = 'ativo'
    LIMIT 1
)
WHERE company_id IS NULL AND site_email IS NOT NULL;

-- Para registros que não conseguimos mapear por email, vamos usar a empresa mais antiga
UPDATE public.company_settings 
SET company_id = (
    SELECT id FROM public.companies ORDER BY created_at ASC LIMIT 1
)
WHERE company_id IS NULL;

-- Atualizar políticas RLS para company_settings
DROP POLICY IF EXISTS "Acesso público para leitura de configurações" ON public.company_settings;
DROP POLICY IF EXISTS "Admins e gestores podem atualizar configurações da empresa" ON public.company_settings;
DROP POLICY IF EXISTS "Admins podem inserir configurações da empresa" ON public.company_settings;

-- Nova política para leitura - usuários veem apenas configurações da sua empresa
CREATE POLICY "Usuarios podem ver configuracoes da empresa"
ON public.company_settings
FOR SELECT
USING (
    company_id = get_user_company_id() OR 
    is_super_admin() OR
    company_id IS NULL -- Para compatibilidade temporária
);

-- Nova política para inserção 
CREATE POLICY "Admins podem inserir configuracoes da empresa"
ON public.company_settings
FOR INSERT
WITH CHECK (
    (company_id = get_user_company_id() AND EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'admin'::user_role 
        AND status = 'ativo'::user_status
    )) OR is_super_admin()
);

-- Nova política para atualização
CREATE POLICY "Admins e gestores podem atualizar configuracoes da empresa"
ON public.company_settings
FOR UPDATE
USING (
    (company_id = get_user_company_id() AND EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid() 
        AND u.role IN ('admin'::user_role, 'gestor'::user_role)
        AND u.status = 'ativo'::user_status
        AND u.company_id = get_user_company_id()
    )) OR is_super_admin()
);

-- Política para acesso público (apenas para leitura do site público)
CREATE POLICY "Acesso publico para leitura do site"
ON public.company_settings
FOR SELECT
USING (true);