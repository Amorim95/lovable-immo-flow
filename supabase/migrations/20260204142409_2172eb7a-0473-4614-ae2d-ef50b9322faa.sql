-- Adicionar colunas em company_settings para configuração do repique automático
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS auto_repique_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_repique_minutes integer DEFAULT 5;

-- Adicionar colunas em leads para rastrear atribuição e repiques
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS assigned_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS repique_count integer DEFAULT 0;

-- Atualizar leads existentes para preencher assigned_at com created_at
UPDATE leads SET assigned_at = created_at WHERE assigned_at IS NULL;

-- Criar índice para otimizar a busca de leads para repique
CREATE INDEX IF NOT EXISTS idx_leads_repique_check 
ON leads (company_id, assigned_at, primeiro_contato_whatsapp) 
WHERE etapa = 'aguardando-atendimento';