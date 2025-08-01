-- Adicionar campo para rastrear o primeiro clique no WhatsApp
ALTER TABLE public.leads 
ADD COLUMN primeiro_contato_whatsapp TIMESTAMP WITH TIME ZONE;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.leads.primeiro_contato_whatsapp IS 'Timestamp do primeiro clique no botão WhatsApp para este lead';