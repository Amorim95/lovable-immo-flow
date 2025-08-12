-- Criar tabela companies
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Adicionar company_id nas tabelas existentes
ALTER TABLE public.users ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.leads ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.equipes ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.logs ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.imoveis ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.metas ADD COLUMN company_id UUID REFERENCES public.companies(id);

-- Criar função para obter company_id do usuário atual
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid();
$$;

-- Criar função para verificar se usuário é super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND company_id IS NULL
  );
$$;

-- Políticas RLS para companies
CREATE POLICY "Super admins podem gerenciar todas as empresas"
ON public.companies
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Usuários podem ver sua própria empresa"
ON public.companies
FOR SELECT
USING (id = public.get_user_company_id());

-- Refatorar políticas RLS existentes para incluir isolamento por company_id

-- Users policies
DROP POLICY IF EXISTS "Public access to users" ON public.users;
DROP POLICY IF EXISTS "allow_users_select_own" ON public.users;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios dados" ON public.users;
DROP POLICY IF EXISTS "Admins e gestores podem atualizar qualquer usuário" ON public.users;
DROP POLICY IF EXISTS "Admins e gestores podem deletar usuários" ON public.users;

CREATE POLICY "Super admins podem gerenciar todos os usuários"
ON public.users
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Usuários podem ver usuários da mesma empresa"
ON public.users
FOR SELECT
USING (company_id = public.get_user_company_id() OR public.is_super_admin());

CREATE POLICY "Usuários podem atualizar seus próprios dados"
ON public.users
FOR UPDATE
USING (id = auth.uid() AND company_id = public.get_user_company_id());

CREATE POLICY "Admins podem gerenciar usuários da mesma empresa"
ON public.users
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() 
    AND u.role = 'admin' 
    AND u.company_id = users.company_id
    AND u.status = 'ativo'
  )
);

-- Leads policies
DROP POLICY IF EXISTS "Usuários autorizados podem visualizar leads" ON public.leads;
DROP POLICY IF EXISTS "Usuarios autenticados podem criar leads" ON public.leads;
DROP POLICY IF EXISTS "Usuários podem atualizar leads conforme permissões" ON public.leads;

CREATE POLICY "Usuários podem ver leads da mesma empresa"
ON public.leads
FOR SELECT
USING (
  company_id = public.get_user_company_id() OR public.is_super_admin()
);

CREATE POLICY "Usuários podem criar leads para sua empresa"
ON public.leads
FOR INSERT
WITH CHECK (
  company_id = public.get_user_company_id()
);

CREATE POLICY "Usuários podem atualizar leads da mesma empresa"
ON public.leads
FOR UPDATE
USING (
  company_id = public.get_user_company_id() AND
  (user_id = auth.uid() OR 
   EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'gestor')))
);

-- Equipes policies
DROP POLICY IF EXISTS "Usuários podem ver equipes conforme permissões" ON public.equipes;
DROP POLICY IF EXISTS "Admins e gestores podem criar equipes" ON public.equipes;
DROP POLICY IF EXISTS "Admins e gestores podem atualizar equipes" ON public.equipes;
DROP POLICY IF EXISTS "Admins e gestores podem deletar equipes" ON public.equipes;

CREATE POLICY "Usuários podem ver equipes da mesma empresa"
ON public.equipes
FOR SELECT
USING (company_id = public.get_user_company_id() OR public.is_super_admin());

CREATE POLICY "Admins e gestores podem gerenciar equipes da mesma empresa"
ON public.equipes
FOR ALL
USING (
  company_id = public.get_user_company_id() AND
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() 
    AND u.role IN ('admin', 'gestor') 
    AND u.status = 'ativo'
  )
);

-- Imoveis policies
DROP POLICY IF EXISTS "Usuários podem ver seus próprios imóveis" ON public.imoveis;
DROP POLICY IF EXISTS "Usuários podem criar seus próprios imóveis" ON public.imoveis;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios imóveis" ON public.imoveis;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios imóveis" ON public.imoveis;

CREATE POLICY "Usuários podem gerenciar imóveis da mesma empresa"
ON public.imoveis
FOR ALL
USING (company_id = public.get_user_company_id() OR public.is_super_admin());

-- Logs policies
DROP POLICY IF EXISTS "Usuários podem ver seus próprios logs" ON public.logs;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir logs" ON public.logs;

CREATE POLICY "Usuários podem ver logs da mesma empresa"
ON public.logs
FOR SELECT
USING (company_id = public.get_user_company_id() OR public.is_super_admin());

CREATE POLICY "Usuários podem inserir logs para sua empresa"
ON public.logs
FOR INSERT
WITH CHECK (company_id = public.get_user_company_id());

-- Metas policies
DROP POLICY IF EXISTS "Users can view metas if they have permission" ON public.metas;
DROP POLICY IF EXISTS "Admins and gestores can manage metas" ON public.metas;

CREATE POLICY "Usuários podem ver metas da mesma empresa"
ON public.metas
FOR SELECT
USING (company_id = public.get_user_company_id() OR public.is_super_admin());

CREATE POLICY "Admins e gestores podem gerenciar metas da mesma empresa"
ON public.metas
FOR ALL
USING (
  company_id = public.get_user_company_id() AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() 
    AND role IN ('admin', 'gestor') 
    AND status = 'ativo'
  )
);

-- Atualizar triggers para incluir company_id
CREATE OR REPLACE FUNCTION public.assign_lead_to_creator()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  current_company_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Obter company_id do usuário
  SELECT company_id INTO current_company_id 
  FROM public.users 
  WHERE id = current_user_id;
  
  -- Se user_id não foi fornecido, usar o usuário logado
  IF NEW.user_id IS NULL THEN
    NEW.user_id := current_user_id;
  END IF;
  
  -- Definir company_id do lead
  IF NEW.company_id IS NULL THEN
    NEW.company_id := current_company_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Atualizar função de round-robin para considerar company_id
CREATE OR REPLACE FUNCTION public.get_next_user_round_robin()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_user_id UUID;
  current_company_id UUID;
BEGIN
  -- Obter company_id do usuário atual
  SELECT company_id INTO current_company_id 
  FROM public.users 
  WHERE id = auth.uid();
  
  -- Buscar usuário da mesma empresa que recebeu lead há mais tempo
  SELECT id INTO next_user_id
  FROM users
  WHERE status = 'ativo' 
  AND company_id = current_company_id
  ORDER BY 
    ultimo_lead_recebido NULLS FIRST,
    ultimo_lead_recebido ASC
  LIMIT 1;

  IF next_user_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum usuário ativo disponível para atribuição na empresa';
  END IF;

  UPDATE users 
  SET ultimo_lead_recebido = now()
  WHERE id = next_user_id;

  RETURN next_user_id;
END;
$$;