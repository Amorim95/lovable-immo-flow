-- SOLUÇÃO DEFINITIVA: Política que funciona com usuários reais da tabela users

-- Remover política atual
DROP POLICY IF EXISTS "Permitir INSERT para usuarios autenticados" ON public.leads;

-- Criar política que verifica se o usuário existe na tabela users e está ativo
CREATE POLICY "Usuarios ativos podem criar leads" 
ON public.leads 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND status = 'ativo'
  )
);

-- Melhorar o trigger para ser mais robusto
DROP FUNCTION IF EXISTS public.assign_lead_to_creator() CASCADE;

CREATE OR REPLACE FUNCTION public.assign_lead_to_creator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  current_user_id UUID;
BEGIN
  -- Obter o ID do usuário autenticado
  current_user_id := auth.uid();
  
  -- Se user_id não foi fornecido, usar o usuário logado
  IF NEW.user_id IS NULL THEN
    NEW.user_id := current_user_id;
  END IF;
  
  -- Verificar se o usuário existe e está ativo (só para debug)
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = NEW.user_id 
    AND status = 'ativo'
  ) THEN
    RAISE NOTICE 'Usuário % não encontrado ou inativo na tabela users', NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recriar o trigger
CREATE TRIGGER assign_lead_to_creator
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_lead_to_creator();