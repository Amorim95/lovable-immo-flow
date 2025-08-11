-- Criar tabela de metas para equipes e corretores
CREATE TABLE public.metas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('equipe', 'corretor', 'geral')),
  referencia_id UUID, -- ID da equipe ou corretor (NULL para meta geral)
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL CHECK (ano >= 2000),
  meta_leads INTEGER NOT NULL DEFAULT 0,
  meta_vendas INTEGER NOT NULL DEFAULT 0,
  meta_conversao DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tipo, referencia_id, mes, ano)
);

-- Enable Row Level Security
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;

-- Create policies for metas access
CREATE POLICY "Users can view metas if they have permission"
  ON public.metas
  FOR SELECT
  USING (
    -- Admins podem ver todas as metas
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin' AND status = 'ativo'
    )
    OR
    -- Gestores podem ver metas da sua equipe
    (
      tipo = 'equipe' AND
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role = 'gestor' 
        AND status = 'ativo'
        AND equipe_id = referencia_id
      )
    )
    OR
    -- Corretores podem ver suas próprias metas
    (
      tipo = 'corretor' AND
      referencia_id = auth.uid()
    )
    OR
    -- Todos podem ver metas gerais
    tipo = 'geral'
  );

CREATE POLICY "Admins and gestores can manage metas"
  ON public.metas
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'gestor') 
      AND status = 'ativo'
    )
  );

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_metas_updated_at
  BEFORE UPDATE ON public.metas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir algumas metas de exemplo para o mês atual
INSERT INTO public.metas (tipo, referencia_id, mes, ano, meta_leads, meta_vendas, meta_conversao) VALUES
('geral', NULL, EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER, 100, 15, 15.00);

-- Inserir metas para equipes existentes
INSERT INTO public.metas (tipo, referencia_id, mes, ano, meta_leads, meta_vendas, meta_conversao)
SELECT 
  'equipe',
  e.id,
  EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER,
  EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
  50, -- 50 leads por equipe
  8,  -- 8 vendas por equipe
  16.00 -- 16% de conversão
FROM public.equipes e;

-- Inserir metas para corretores ativos
INSERT INTO public.metas (tipo, referencia_id, mes, ano, meta_leads, meta_vendas, meta_conversao)
SELECT 
  'corretor',
  u.id,
  EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER,
  EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
  25, -- 25 leads por corretor
  4,  -- 4 vendas por corretor
  16.00 -- 16% de conversão
FROM public.users u
WHERE u.status = 'ativo' AND u.role IN ('corretor', 'gestor');