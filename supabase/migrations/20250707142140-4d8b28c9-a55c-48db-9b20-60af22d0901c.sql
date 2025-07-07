-- Adicionar campo de dados adicionais e remover campos desnecessários
ALTER TABLE public.leads 
ADD COLUMN dados_adicionais TEXT;

-- Remover campos que não serão mais utilizados
ALTER TABLE public.leads 
DROP COLUMN telefone_extra,
DROP COLUMN renda_familiar,
DROP COLUMN tem_fgts,
DROP COLUMN possui_entrada,
DROP COLUMN imovel;

-- Remover a validação de campos imutáveis já que alguns campos foram removidos
DROP TRIGGER IF EXISTS validate_immutable_lead_fields_trigger ON public.leads;
DROP FUNCTION IF EXISTS public.validate_immutable_lead_fields();

-- Criar nova função de validação apenas para nome e telefone
CREATE OR REPLACE FUNCTION public.validate_immutable_lead_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Verificar se campos imutáveis foram alterados
    IF OLD.nome != NEW.nome OR 
       OLD.telefone != NEW.telefone THEN
      RAISE EXCEPTION 'Campos imutáveis não podem ser alterados: nome, telefone';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Recriar o trigger
CREATE TRIGGER validate_immutable_lead_fields_trigger
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_immutable_lead_fields();