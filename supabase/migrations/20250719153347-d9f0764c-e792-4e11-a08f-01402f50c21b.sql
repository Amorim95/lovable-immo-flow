-- Adicionar coluna para armazenar atividades na tabela leads
ALTER TABLE public.leads ADD COLUMN atividades JSONB DEFAULT '[]'::jsonb;