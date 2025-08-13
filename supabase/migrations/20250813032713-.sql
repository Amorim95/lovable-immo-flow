-- Adicionar campos para domínio personalizado na tabela company_settings
ALTER TABLE public.company_settings 
ADD COLUMN custom_domain text,
ADD COLUMN domain_status text DEFAULT 'pendente' CHECK (domain_status IN ('pendente', 'ativo', 'erro')),
ADD COLUMN ssl_status text DEFAULT 'pendente' CHECK (ssl_status IN ('pendente', 'ativo', 'erro')),
ADD COLUMN domain_verified_at timestamp with time zone;

-- Índice para buscar empresa por domínio personalizado
CREATE INDEX idx_company_settings_custom_domain ON public.company_settings(custom_domain) WHERE custom_domain IS NOT NULL;