-- Criar tabela de equipes
CREATE TABLE public.equipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  responsavel_id UUID REFERENCES public.users(id),
  responsavel_nome TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.equipes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para equipes
CREATE POLICY "Usuários ativos podem ver equipes" 
ON public.equipes 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE id = auth.uid() AND status = 'ativo'
));

CREATE POLICY "Admins podem gerenciar equipes" 
ON public.equipes 
FOR ALL 
USING (is_admin(auth.uid()));

-- Adicionar coluna equipe_id na tabela users
ALTER TABLE public.users ADD COLUMN equipe_id UUID REFERENCES public.equipes(id);

-- Adicionar trigger para updated_at
CREATE TRIGGER update_equipes_updated_at
BEFORE UPDATE ON public.equipes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar mais colunas de permissões
ALTER TABLE public.permissions 
ADD COLUMN can_manage_leads BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN can_view_reports BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN can_manage_properties BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN can_manage_teams BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN can_access_configurations BOOLEAN NOT NULL DEFAULT false;

-- Inserir as equipes existentes
INSERT INTO public.equipes (id, nome, responsavel_nome) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'Equipe Zona Sul', 'Maria Santos'),
('550e8400-e29b-41d4-a716-446655440002', 'Equipe Barra', 'Pedro Oliveira');