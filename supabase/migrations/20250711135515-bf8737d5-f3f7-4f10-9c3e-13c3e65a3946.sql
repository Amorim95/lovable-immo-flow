-- Verificar se o enum user_role inclui 'gestor'
-- Se não incluir, vamos adicionar
DO $$
BEGIN
    -- Verificar se o valor 'gestor' existe no enum
    IF NOT EXISTS (
        SELECT 1 FROM unnest(enum_range(NULL::user_role)) AS enum_val WHERE enum_val = 'gestor'
    ) THEN
        -- Adicionar 'gestor' ao enum user_role
        ALTER TYPE user_role ADD VALUE 'gestor';
        RAISE NOTICE 'Valor "gestor" adicionado ao enum user_role';
    ELSE
        RAISE NOTICE 'Valor "gestor" já existe no enum user_role';
    END IF;
END $$;