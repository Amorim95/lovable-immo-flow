-- Adicionar campos para configurações do site público
ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS site_title text,
ADD COLUMN IF NOT EXISTS site_description text,
ADD COLUMN IF NOT EXISTS site_phone text,
ADD COLUMN IF NOT EXISTS site_email text,
ADD COLUMN IF NOT EXISTS site_address text,
ADD COLUMN IF NOT EXISTS site_whatsapp text,
ADD COLUMN IF NOT EXISTS site_facebook text,
ADD COLUMN IF NOT EXISTS site_instagram text;