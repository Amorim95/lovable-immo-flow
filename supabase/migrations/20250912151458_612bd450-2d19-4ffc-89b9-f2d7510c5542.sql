-- Update the "Lead Qualificado" tag to have golden metallic color
UPDATE lead_tags 
SET cor = 'linear-gradient(135deg, #FFD700, #FFA500, #FF8C00)' 
WHERE nome = 'Lead Qualificado';