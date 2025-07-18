-- VERIFICAR E CORRIGIR O TRIGGER DE ATRIBUIÇÃO DE LEADS

-- Primeiro, verificar se a função existe e está correta
DROP FUNCTION IF EXISTS public.assign_lead_to_creator() CASCADE;

CREATE OR REPLACE FUNCTION public.assign_lead_to_creator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Debug: Verificar se auth.uid() retorna um valor
  RAISE LOG 'auth.uid() retorna: %', auth.uid();
  
  -- Se user_id não estiver definido, atribuir ao usuário logado
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
    RAISE LOG 'user_id definido como: %', NEW.user_id;
  END IF;
  
  -- Verificar se o usuário existe na tabela users
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.user_id) THEN
    RAISE EXCEPTION 'Usuário % não encontrado na tabela users', NEW.user_id;
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

-- Também vamos criar uma política mais robusta para INSERT
DROP POLICY IF EXISTS "Usuários autenticados podem inserir leads" ON public.leads;

CREATE POLICY "Usuários autenticados podem inserir leads" 
ON public.leads 
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Verificar se o usuário existe na tabela users
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND status = 'ativo')
);