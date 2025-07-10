-- Adicionar campos para controle de fila de leads
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ultimo_lead_recebido TIMESTAMP WITH TIME ZONE;

-- Criar tabela para controle de fila de distribuição
CREATE TABLE IF NOT EXISTS public.lead_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS na tabela lead_queue
ALTER TABLE public.lead_queue ENABLE ROW LEVEL SECURITY;

-- Políticas para lead_queue
CREATE POLICY "Corretores podem ver sua fila" 
ON public.lead_queue 
FOR SELECT 
USING (assigned_to = auth.uid() OR can_view_all_leads(auth.uid()));

CREATE POLICY "Sistema pode inserir na fila" 
ON public.lead_queue 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar fila" 
ON public.lead_queue 
FOR UPDATE 
USING (true);

-- Função para obter próximo corretor na fila
CREATE OR REPLACE FUNCTION public.get_next_corretor_in_queue()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_corretor_id uuid;
BEGIN
  -- Buscar corretor ativo que recebeu lead há mais tempo (ou nunca recebeu)
  SELECT u.id INTO next_corretor_id
  FROM public.users u
  JOIN public.permissions p ON p.user_id = u.id
  WHERE u.role = 'corretor' 
    AND u.status = 'ativo'
  ORDER BY 
    u.ultimo_lead_recebido NULLS FIRST,
    u.ultimo_lead_recebido ASC
  LIMIT 1;
  
  -- Atualizar timestamp do último lead recebido
  IF next_corretor_id IS NOT NULL THEN
    UPDATE public.users 
    SET ultimo_lead_recebido = now()
    WHERE id = next_corretor_id;
  END IF;
  
  RETURN next_corretor_id;
END;
$$;

-- Função para distribuir lead automaticamente
CREATE OR REPLACE FUNCTION public.distribute_lead_to_queue()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_corretor uuid;
BEGIN
  -- Obter próximo corretor na fila
  SELECT public.get_next_corretor_in_queue() INTO next_corretor;
  
  -- Se encontrou um corretor, atribuir o lead
  IF next_corretor IS NOT NULL THEN
    INSERT INTO public.lead_queue (lead_id, assigned_to, status, assigned_at)
    VALUES (NEW.id, next_corretor, 'assigned', now());
    
    -- Atualizar o lead com o corretor atribuído
    UPDATE public.leads 
    SET user_id = next_corretor
    WHERE id = NEW.id;
  ELSE
    -- Se não há corretores ativos, colocar na fila sem atribuição
    INSERT INTO public.lead_queue (lead_id, status)
    VALUES (NEW.id, 'pending');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para distribuição automática de leads
DROP TRIGGER IF EXISTS auto_distribute_leads ON public.leads;
CREATE TRIGGER auto_distribute_leads
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.distribute_lead_to_queue();