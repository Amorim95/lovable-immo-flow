-- Criar tabela para controle de acesso por empresa
CREATE TABLE public.company_access_control (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  site_enabled BOOLEAN NOT NULL DEFAULT true,
  imoveis_enabled BOOLEAN NOT NULL DEFAULT true,
  dashboards_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- Habilitar RLS
ALTER TABLE public.company_access_control ENABLE ROW LEVEL SECURITY;

-- Política para super admins gerenciarem controle de acesso
CREATE POLICY "Super admins podem gerenciar controle de acesso" 
ON public.company_access_control 
FOR ALL 
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Política para usuários verificarem o acesso de sua empresa
CREATE POLICY "Usuários podem ver controle de acesso da empresa" 
ON public.company_access_control 
FOR SELECT 
USING (company_id = get_user_company_id());

-- Trigger para atualizar updated_at
CREATE TRIGGER update_company_access_control_updated_at
BEFORE UPDATE ON public.company_access_control
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir registros padrão para empresas existentes
INSERT INTO public.company_access_control (company_id, site_enabled, imoveis_enabled, dashboards_enabled)
SELECT id, true, true, true
FROM public.companies
WHERE id NOT IN (SELECT company_id FROM public.company_access_control);