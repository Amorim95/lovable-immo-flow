-- SIMPLIFICAR o sistema de leads - remover triggers complexos
DROP TRIGGER IF EXISTS auto_distribute_leads ON public.leads;
DROP TRIGGER IF EXISTS add_to_queue ON public.leads;

-- Criar trigger SIMPLES apenas para definir user_id se não fornecido
CREATE OR REPLACE FUNCTION public.simple_lead_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Se user_id não foi fornecido, atribuir ao admin
  IF NEW.user_id IS NULL THEN
    SELECT id INTO NEW.user_id 
    FROM public.users 
    WHERE role = 'admin' AND status = 'ativo' 
    LIMIT 1;
    
    -- Se não tem admin, usar qualquer usuário ativo
    IF NEW.user_id IS NULL THEN
      SELECT id INTO NEW.user_id 
      FROM public.users 
      WHERE status = 'ativo' 
      LIMIT 1;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Aplicar trigger simples
CREATE TRIGGER simple_lead_assignment
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.simple_lead_assignment();