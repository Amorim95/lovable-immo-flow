-- Criar tabela para histórico de exportações
CREATE TABLE public.export_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL CHECK (export_type IN ('excel', 'pdf')),
  total_leads INTEGER NOT NULL,
  filters_applied JSONB,
  filename TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.export_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem inserir seu próprio histórico"
ON public.export_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver histórico da empresa"
ON public.export_history
FOR SELECT
USING (company_id = get_user_company_id());

-- Índice para melhorar performance de consultas
CREATE INDEX idx_export_history_company_created ON public.export_history(company_id, created_at DESC);
CREATE INDEX idx_export_history_user ON public.export_history(user_id);