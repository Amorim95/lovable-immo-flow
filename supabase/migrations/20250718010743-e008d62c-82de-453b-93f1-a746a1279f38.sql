-- Remover políticas de SELECT existentes na tabela leads
DROP POLICY IF EXISTS "Corretores podem ver seus próprios leads" ON public.leads;
DROP POLICY IF EXISTS "Usuários com permissão podem ver todos os leads" ON public.leads;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios leads ou todos se tiverem pe" ON public.leads;

-- Criar nova política abrangente para visualização de leads
CREATE POLICY "Usuários autorizados podem visualizar leads"
ON public.leads FOR SELECT
USING (
  (user_id = auth.uid()) OR
  ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin') OR
  (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'gestor' AND
    (SELECT equipe_id FROM public.users WHERE id = auth.uid()) = (SELECT equipe_id FROM public.users WHERE id = leads.user_id)
  )
);