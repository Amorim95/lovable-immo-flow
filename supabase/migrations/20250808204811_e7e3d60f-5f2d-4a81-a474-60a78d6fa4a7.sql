-- Adicionar campo "sobre" para configurações do site
ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS site_about text;