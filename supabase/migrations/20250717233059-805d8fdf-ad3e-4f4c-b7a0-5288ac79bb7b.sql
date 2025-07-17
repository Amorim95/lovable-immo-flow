-- Corrigir função que pode ter ambiguidade de user_id
DROP TRIGGER IF EXISTS distribute_lead_trigger ON public.leads;
DROP TRIGGER IF EXISTS add_to_queue_trigger ON public.leads;

-- Recriar função de distribuição sem ambiguidade
CREATE OR REPLACE FUNCTION public.distribute_lead_to_queue()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  next_corretor uuid;
  admin_user uuid;
BEGIN
  -- Obter próximo corretor na fila
  SELECT public.get_next_corretor_in_queue() INTO next_corretor;
  
  -- Se encontrou um corretor, atribuir o lead
  IF next_corretor IS NOT NULL THEN
    NEW.user_id := next_corretor;
  ELSE
    -- Se não há corretores ativos, atribuir ao admin
    SELECT u.id INTO admin_user 
    FROM public.users u 
    WHERE u.role = 'admin' AND u.status = 'ativo' 
    LIMIT 1;
    
    IF admin_user IS NOT NULL THEN
      NEW.user_id := admin_user;
    ELSE
      -- Se nem admin existe, usar o primeiro usuário disponível
      SELECT u.id INTO admin_user 
      FROM public.users u 
      WHERE u.status = 'ativo' 
      LIMIT 1;
      NEW.user_id := COALESCE(admin_user, gen_random_uuid());
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recriar trigger BEFORE INSERT para distribuição
CREATE TRIGGER distribute_lead_trigger
  BEFORE INSERT ON public.leads
  FOR EACH ROW 
  WHEN (NEW.user_id IS NULL)
  EXECUTE FUNCTION public.distribute_lead_to_queue();

-- Recriar função para adicionar à fila sem ambiguidade  
CREATE OR REPLACE FUNCTION public.add_lead_to_queue()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Inserir na fila após o lead ser criado
  INSERT INTO public.lead_queue (lead_id, assigned_to, status, assigned_at)
  VALUES (NEW.id, NEW.user_id, 'assigned', now());
  
  RETURN NEW;
END;
$function$;

-- Recriar trigger AFTER INSERT para fila
CREATE TRIGGER add_to_queue_trigger
  AFTER INSERT ON public.leads
  FOR EACH ROW 
  EXECUTE FUNCTION public.add_lead_to_queue();