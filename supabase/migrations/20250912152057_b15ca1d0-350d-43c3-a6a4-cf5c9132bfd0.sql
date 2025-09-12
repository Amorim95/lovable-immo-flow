-- Update the tag name from "Lead Qualificado" to "Lead Qualificado Pela IA"
UPDATE lead_tags 
SET nome = 'Lead Qualificado Pela IA' 
WHERE nome = 'Lead Qualificado';