
-- Criar enum para roles dos usuários
CREATE TYPE public.user_role AS ENUM ('admin', 'corretor');

-- Criar enum para status dos usuários
CREATE TYPE public.user_status AS ENUM ('ativo', 'inativo', 'pendente');

-- Criar enum para etapas dos leads
CREATE TYPE public.lead_stage AS ENUM (
  'aguardando-atendimento',
  'tentativas-contato', 
  'atendeu',
  'visita',
  'vendas-fechadas',
  'em-pausa'
);

-- Criar enum para plataformas de campanha
CREATE TYPE public.campaign_platform AS ENUM (
  'meta-ads',
  'google-ads',
  'indicacao',
  'manual',
  'outros'
);

-- Criar enum para status de convites
CREATE TYPE public.invitation_status AS ENUM ('pendente', 'aceito', 'expirado');

-- 1. Tabela users
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'corretor',
  status user_status NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Tabela campaigns
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  plataforma campaign_platform NOT NULL,
  data_inicio DATE,
  data_fim DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Tabela leads
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  nome TEXT NOT NULL, -- Campo imutável
  telefone TEXT NOT NULL, -- Campo imutável
  telefone_extra TEXT, -- Campo imutável
  imovel TEXT NOT NULL, -- Campo imutável
  tem_fgts TEXT,
  renda_familiar DECIMAL(10,2),
  possui_entrada TEXT,
  etapa lead_stage NOT NULL DEFAULT 'aguardando-atendimento',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Tabela lead_campaign (relacionamento many-to-many)
CREATE TABLE public.lead_campaign (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lead_id, campaign_id)
);

-- 5. Tabela permissions
CREATE TABLE public.permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  can_view_all_leads BOOLEAN NOT NULL DEFAULT false,
  can_invite_users BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Tabela invitations
CREATE TABLE public.invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  status invitation_status NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days')
);

-- 7. Tabela logs
CREATE TABLE public.logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX idx_leads_user_id ON public.leads(user_id);
CREATE INDEX idx_leads_etapa ON public.leads(etapa);
CREATE INDEX idx_leads_created_at ON public.leads(created_at);
CREATE INDEX idx_lead_campaign_lead_id ON public.lead_campaign(lead_id);
CREATE INDEX idx_lead_campaign_campaign_id ON public.lead_campaign(campaign_id);
CREATE INDEX idx_logs_user_id ON public.logs(user_id);
CREATE INDEX idx_logs_created_at ON public.logs(created_at);
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_email ON public.invitations(email);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_campaign ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- Função para verificar se o usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id AND role = 'admin' AND status = 'ativo'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Função para verificar se o usuário pode ver todos os leads
CREATE OR REPLACE FUNCTION public.can_view_all_leads(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.permissions p
    JOIN public.users u ON u.id = p.user_id
    WHERE p.user_id = user_id 
    AND p.can_view_all_leads = true 
    AND u.status = 'ativo'
  ) OR public.is_admin(user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Função para verificar se o usuário pode convidar outros usuários
CREATE OR REPLACE FUNCTION public.can_invite_users(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.permissions p
    JOIN public.users u ON u.id = p.user_id
    WHERE p.user_id = user_id 
    AND p.can_invite_users = true 
    AND u.status = 'ativo'
  ) OR public.is_admin(user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Políticas RLS para users
CREATE POLICY "Usuários podem ver seu próprio perfil" ON public.users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admins podem ver todos os usuários" ON public.users
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins podem inserir usuários" ON public.users
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins podem atualizar usuários" ON public.users
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- Políticas RLS para leads
CREATE POLICY "Corretores podem ver seus próprios leads" ON public.leads
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Usuários com permissão podem ver todos os leads" ON public.leads
  FOR SELECT USING (public.can_view_all_leads(auth.uid()));

CREATE POLICY "Corretores podem inserir leads" ON public.leads
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Corretores podem atualizar seus próprios leads" ON public.leads
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Usuários com permissão podem atualizar todos os leads" ON public.leads
  FOR UPDATE USING (public.can_view_all_leads(auth.uid()));

-- Políticas RLS para campaigns
CREATE POLICY "Usuários ativos podem ver campanhas" ON public.campaigns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND status = 'ativo'
    )
  );

CREATE POLICY "Admins podem gerenciar campanhas" ON public.campaigns
  FOR ALL USING (public.is_admin(auth.uid()));

-- Políticas RLS para lead_campaign
CREATE POLICY "Usuários podem ver relacionamentos de leads que têm acesso" ON public.lead_campaign
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.leads l 
      WHERE l.id = lead_id 
      AND (l.user_id = auth.uid() OR public.can_view_all_leads(auth.uid()))
    )
  );

CREATE POLICY "Corretores podem inserir relacionamentos de seus leads" ON public.lead_campaign
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leads l 
      WHERE l.id = lead_id AND l.user_id = auth.uid()
    )
  );

-- Políticas RLS para permissions
CREATE POLICY "Usuários podem ver suas próprias permissões" ON public.permissions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins podem ver todas as permissões" ON public.permissions
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins podem gerenciar permissões" ON public.permissions
  FOR ALL USING (public.is_admin(auth.uid()));

-- Políticas RLS para invitations
CREATE POLICY "Usuários com permissão podem ver convites" ON public.invitations
  FOR SELECT USING (public.can_invite_users(auth.uid()));

CREATE POLICY "Usuários com permissão podem criar convites" ON public.invitations
  FOR INSERT WITH CHECK (public.can_invite_users(auth.uid()));

CREATE POLICY "Usuários com permissão podem atualizar convites" ON public.invitations
  FOR UPDATE USING (public.can_invite_users(auth.uid()));

-- Políticas RLS para logs
CREATE POLICY "Usuários podem ver seus próprios logs" ON public.logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins podem ver todos os logs" ON public.logs
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Usuários autenticados podem inserir logs" ON public.logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nas tabelas que possuem updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON public.permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar log automaticamente quando leads são modificados
CREATE OR REPLACE FUNCTION public.log_lead_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.logs (user_id, action, entity, entity_id, details)
    VALUES (NEW.user_id, 'Lead criado', 'lead', NEW.id, row_to_json(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log apenas se houve mudança na etapa
    IF OLD.etapa != NEW.etapa THEN
      INSERT INTO public.logs (user_id, action, entity, entity_id, details)
      VALUES (
        auth.uid(), 
        'Etapa alterada de ' || OLD.etapa || ' para ' || NEW.etapa, 
        'lead', 
        NEW.id,
        jsonb_build_object('old_etapa', OLD.etapa, 'new_etapa', NEW.etapa)
      );
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para log automático de mudanças em leads
CREATE TRIGGER log_lead_changes_trigger
  AFTER INSERT OR UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.log_lead_changes();

-- Função para validar campos imutáveis dos leads
CREATE OR REPLACE FUNCTION public.validate_immutable_lead_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Verificar se campos imutáveis foram alterados
    IF OLD.nome != NEW.nome OR 
       OLD.telefone != NEW.telefone OR 
       COALESCE(OLD.telefone_extra, '') != COALESCE(NEW.telefone_extra, '') OR
       OLD.imovel != NEW.imovel THEN
      RAISE EXCEPTION 'Campos imutáveis não podem ser alterados: nome, telefone, telefone_extra, imovel';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar campos imutáveis
CREATE TRIGGER validate_immutable_lead_fields_trigger
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.validate_immutable_lead_fields();
