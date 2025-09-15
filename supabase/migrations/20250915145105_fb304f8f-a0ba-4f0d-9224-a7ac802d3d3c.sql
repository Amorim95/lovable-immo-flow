-- Remover todas as relações da etiqueta incorreta que criei
DELETE FROM lead_tag_relations 
WHERE tag_id = '5fe487f5-051e-4694-901d-cae0418f8588';

-- Apagar a etiqueta incorreta que criei
DELETE FROM lead_tags 
WHERE id = '5fe487f5-051e-4694-901d-cae0418f8588';

-- Adicionar todos os leads à etiqueta correta (89b0d175-7ac8-44b3-9f47-dec34353ccac)
DO $$
DECLARE
    lead_record RECORD;
BEGIN
    FOR lead_record IN SELECT id FROM leads LOOP
        INSERT INTO lead_tag_relations (lead_id, tag_id)
        SELECT lead_record.id, '89b0d175-7ac8-44b3-9f47-dec34353ccac'
        WHERE NOT EXISTS (
            SELECT 1 FROM lead_tag_relations 
            WHERE lead_id = lead_record.id AND tag_id = '89b0d175-7ac8-44b3-9f47-dec34353ccac'
        );
    END LOOP;
    
    RAISE NOTICE 'Todos os leads foram marcados com a etiqueta correta: 89b0d175-7ac8-44b3-9f47-dec34353ccac';
END $$;