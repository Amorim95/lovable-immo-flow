-- Adicionar campo para rastrear primeira visualização do lead
ALTER TABLE public.leads 
ADD COLUMN primeira_visualizacao timestamp with time zone;