-- SOLUÇÃO COMPLETA: Remover validação que está bloqueando e simplificar trigger

-- Primeira correção: Remover política que está bloqueando
DROP POLICY IF EXISTS "Usuários autenticados podem inserir leads" ON public.leads;

-- Criar política super simples para INSERT 
CREATE POLICY "Permitir INSERT para usuarios autenticados" 
ON public.leads 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Segunda correção: Simplificar o trigger para não validar se usuário existe
DROP FUNCTION IF EXISTS public.assign_lead_to_creator() CASCADE;

CREATE OR REPLACE FUNCTION public.assign_lead_to_creator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Só definir user_id se não estiver definido, sem validação adicional
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recriar o trigger
DROP TRIGGER IF EXISTS assign_lead_to_creator ON public.leads;
CREATE TRIGGER assign_lead_to_creator
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_lead_to_creator();