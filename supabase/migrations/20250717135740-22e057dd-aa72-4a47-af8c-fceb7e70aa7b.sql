
-- 1. Modificar a tabela leads para permitir user_id NULL e ajustar a foreign key
ALTER TABLE public.leads
DROP CONSTRAINT IF EXISTS leads_user_id_fkey;

ALTER TABLE public.leads ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.leads
ADD CONSTRAINT leads_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- 2. Remover políticas RLS existentes na tabela leads
DROP POLICY IF EXISTS "Corretores podem atualizar seus próprios leads" ON public.leads;
DROP POLICY IF EXISTS "Corretores podem inserir leads" ON public.leads;
DROP POLICY IF EXISTS "Corretores podem ver seus próprios leads" ON public.leads;
DROP POLICY IF EXISTS "Usuários com permissão podem atualizar todos os leads" ON public.leads;
DROP POLICY IF EXISTS "Usuários com permissão podem ver todos os leads" ON public.leads;

-- 3. Criar função para verificar se o usuário é gestor
CREATE OR REPLACE FUNCTION public.is_gestor(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id AND role = 'gestor' AND status = 'ativo'
  );
END;
$function$

-- 4. Criar função para verificar se o usuário é corretor
CREATE OR REPLACE FUNCTION public.is_corretor(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id AND role = 'corretor' AND status = 'ativo'
  );
END;
$function$

-- 5. Criar função para verificar se um lead pertence à equipe do gestor
CREATE OR REPLACE FUNCTION public.lead_belongs_to_team(lead_user_id uuid, manager_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
DECLARE
  manager_equipe_id uuid;
  lead_user_equipe_id uuid;
BEGIN
  -- Buscar equipe_id do gestor
  SELECT equipe_id INTO manager_equipe_id
  FROM public.users 
  WHERE id = manager_id AND role = 'gestor' AND status = 'ativo';
  
  -- Se o gestor não tem equipe definida, retorna false
  IF manager_equipe_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Buscar equipe_id do usuário do lead
  SELECT equipe_id INTO lead_user_equipe_id
  FROM public.users 
  WHERE id = lead_user_id AND status = 'ativo';
  
  -- Verificar se as equipes são iguais
  RETURN manager_equipe_id = lead_user_equipe_id;
END;
$function$

-- 6. Criar novas políticas RLS para leads

-- Admins podem ver todos os leads
CREATE POLICY "Admins podem ver todos os leads" 
ON public.leads 
FOR SELECT 
USING (public.is_admin(auth.uid()));

-- Gestores podem ver leads da sua equipe e leads sem usuário atribuído
CREATE POLICY "Gestores podem ver leads da equipe" 
ON public.leads 
FOR SELECT 
USING (
  public.is_gestor(auth.uid()) AND (
    user_id IS NULL OR 
    public.lead_belongs_to_team(user_id, auth.uid())
  )
);

-- Corretores podem ver apenas seus próprios leads
CREATE POLICY "Corretores podem ver seus próprios leads" 
ON public.leads 
FOR SELECT 
USING (
  public.is_corretor(auth.uid()) AND user_id = auth.uid()
);

-- Admins podem atualizar todos os leads
CREATE POLICY "Admins podem atualizar todos os leads" 
ON public.leads 
FOR UPDATE 
USING (public.is_admin(auth.uid()));

-- Gestores podem atualizar leads da sua equipe
CREATE POLICY "Gestores podem atualizar leads da equipe" 
ON public.leads 
FOR UPDATE 
USING (
  public.is_gestor(auth.uid()) AND (
    user_id IS NULL OR 
    public.lead_belongs_to_team(user_id, auth.uid())
  )
);

-- Corretores podem atualizar apenas seus próprios leads
CREATE POLICY "Corretores podem atualizar seus próprios leads" 
ON public.leads 
FOR UPDATE 
USING (
  public.is_corretor(auth.uid()) AND user_id = auth.uid()
);

-- Admins e gestores podem inserir leads
CREATE POLICY "Admins e gestores podem inserir leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (
  public.is_admin(auth.uid()) OR public.is_gestor(auth.uid())
);

-- Corretores podem inserir leads para si mesmos
CREATE POLICY "Corretores podem inserir seus leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (
  public.is_corretor(auth.uid()) AND user_id = auth.uid()
);

-- Sistema pode inserir leads (para o webhook)
CREATE POLICY "Sistema pode inserir leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (true);
