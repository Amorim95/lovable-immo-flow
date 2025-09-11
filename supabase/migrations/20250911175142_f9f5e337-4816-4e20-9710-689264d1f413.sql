-- Criar tabela para etapas customizadas por empresa
CREATE TABLE public.lead_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  nome TEXT NOT NULL,
  cor TEXT NOT NULL DEFAULT '#3B82F6',
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.lead_stages ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver etapas da empresa" 
ON public.lead_stages 
FOR SELECT 
USING (company_id = get_user_company_id());

CREATE POLICY "Admins podem gerenciar etapas da empresa" 
ON public.lead_stages 
FOR ALL 
USING (
  company_id = get_user_company_id() 
  AND (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE role = 'admin' 
      AND status = 'ativo' 
      AND company_id = get_user_company_id()
    )
    OR is_super_admin()
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_lead_stages_updated_at
BEFORE UPDATE ON public.lead_stages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir etapas padrão para empresas existentes
INSERT INTO public.lead_stages (company_id, nome, cor, ordem)
SELECT 
  c.id as company_id,
  stage_data.nome,
  stage_data.cor,
  stage_data.ordem
FROM companies c
CROSS JOIN (
  VALUES 
    ('Aguardando Atendimento', '#64748B', 1),
    ('Em Tentativas de Contato', '#EAB308', 2),
    ('Atendeu', '#3B82F6', 3),
    ('Nome Sujo', '#F59E0B', 4),
    ('Nome Limpo', '#14B8A6', 5),
    ('Visita', '#8B5CF6', 6),
    ('Vendas Fechadas', '#22C55E', 7),
    ('Em Pausa', '#F97316', 8),
    ('Descarte', '#EF4444', 9)
) AS stage_data(nome, cor, ordem);

-- Adicionar campo stage_name na tabela leads para armazenar o nome customizado
ALTER TABLE public.leads ADD COLUMN stage_name TEXT;