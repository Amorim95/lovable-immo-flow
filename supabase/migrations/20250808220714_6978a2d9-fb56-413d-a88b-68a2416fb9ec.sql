-- Corrigir políticas RLS para company_settings
-- Primeiro, vamos remover as políticas existentes que podem estar muito restritivas
DROP POLICY IF EXISTS "Usuários ativos podem ver configurações da empresa" ON public.company_settings;
DROP POLICY IF EXISTS "Admins podem inserir configurações da empresa" ON public.company_settings;
DROP POLICY IF EXISTS "Admins e gestores podem atualizar configurações da empresa" ON public.company_settings;

-- Criar novas políticas mais permissivas para leitura pública das configurações
CREATE POLICY "Acesso público para leitura de configurações" 
ON public.company_settings 
FOR SELECT 
USING (true);

-- Manter restrição para inserção (apenas admins)
CREATE POLICY "Admins podem inserir configurações da empresa" 
ON public.company_settings 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM users 
  WHERE users.id = auth.uid() 
  AND users.role = 'admin'
));

-- Manter restrição para atualização (admins e gestores)
CREATE POLICY "Admins e gestores podem atualizar configurações da empresa" 
ON public.company_settings 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM users u 
  WHERE u.id = auth.uid() 
  AND (u.role = 'admin' OR (u.role = 'gestor' AND u.status = 'ativo'))
));