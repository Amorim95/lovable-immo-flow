-- CORRIGIR TODAS AS POLÍTICAS RLS DA TABELA LEADS

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Corretores podem atualizar seus próprios leads" ON public.leads;
DROP POLICY IF EXISTS "Usuários com permissão podem ver todos os leads" ON public.leads;
DROP POLICY IF EXISTS "Usuários com permissão podem atualizar todos os leads" ON public.leads;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir leads" ON public.leads;
DROP POLICY IF EXISTS "Corretores podem ver seus próprios leads" ON public.leads;
DROP POLICY IF EXISTS "Permitir INSERT para todos autenticados" ON public.leads;

-- Criar políticas simples e funcionais
CREATE POLICY "Usuários autenticados podem inserir leads" 
ON public.leads 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuários podem ver seus próprios leads ou todos se tiverem permissão" 
ON public.leads 
FOR SELECT 
TO authenticated
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.permissions p
    JOIN public.users u ON u.id = p.user_id
    WHERE p.user_id = auth.uid() 
    AND p.can_view_all_leads = true 
    AND u.status = 'ativo'
  )
);

CREATE POLICY "Usuários podem atualizar seus próprios leads ou todos se tiverem permissão" 
ON public.leads 
FOR UPDATE 
TO authenticated
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.permissions p
    JOIN public.users u ON u.id = p.user_id
    WHERE p.user_id = auth.uid() 
    AND p.can_view_all_leads = true 
    AND u.status = 'ativo'
  )
);

-- Verificar se o trigger está funcionando
DROP TRIGGER IF EXISTS assign_lead_to_creator ON public.leads;
CREATE TRIGGER assign_lead_to_creator
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_lead_to_creator();