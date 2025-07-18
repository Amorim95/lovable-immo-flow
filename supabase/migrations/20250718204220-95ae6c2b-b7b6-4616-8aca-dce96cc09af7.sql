-- Criar tabela para dados da empresa
CREATE TABLE public.company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Política para usuários ativos visualizarem
CREATE POLICY "Usuários ativos podem ver configurações da empresa" 
ON public.company_settings 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE id = auth.uid() AND status = 'ativo'
));

-- Política para admins e gestores atualizarem
CREATE POLICY "Admins e gestores podem atualizar configurações da empresa" 
ON public.company_settings 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE id = auth.uid() 
  AND status = 'ativo' 
  AND (role = 'admin' OR role = 'gestor')
));

-- Política para admins inserirem
CREATE POLICY "Admins podem inserir configurações da empresa" 
ON public.company_settings 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.users 
  WHERE id = auth.uid() 
  AND status = 'ativo' 
  AND role = 'admin'
));

-- Trigger para updated_at
CREATE TRIGGER update_company_settings_updated_at
BEFORE UPDATE ON public.company_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir configuração inicial
INSERT INTO public.company_settings (name, logo) 
VALUES ('Click Imóveis', null);