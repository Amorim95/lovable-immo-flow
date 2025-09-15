-- Criar a etiqueta "Lead Qualificado pela IA" se não existir
INSERT INTO lead_tags (nome, cor)
SELECT 'Lead Qualificado pela IA', '#FFD700'
WHERE NOT EXISTS (
    SELECT 1 FROM lead_tags WHERE nome = 'Lead Qualificado pela IA'
);

-- Obter o ID da etiqueta criada/existente
DO $$
DECLARE
    tag_id_var UUID;
    lead_record RECORD;
BEGIN
    -- Buscar o ID da etiqueta
    SELECT id INTO tag_id_var FROM lead_tags WHERE nome = 'Lead Qualificado pela IA';
    
    -- Adicionar a etiqueta para todos os leads que ainda não a possuem
    FOR lead_record IN SELECT id FROM leads LOOP
        INSERT INTO lead_tag_relations (lead_id, tag_id)
        SELECT lead_record.id, tag_id_var
        WHERE NOT EXISTS (
            SELECT 1 FROM lead_tag_relations 
            WHERE lead_id = lead_record.id AND tag_id = tag_id_var
        );
    END LOOP;
    
    RAISE NOTICE 'Etiqueta "Lead Qualificado pela IA" adicionada a todos os leads';
END $$;