-- Corrigir recursão infinita nas políticas RLS
-- Remover todas as políticas problemáticas
DROP POLICY IF EXISTS "Super admins têm acesso total" ON public.users;
DROP POLICY IF EXISTS "Usuários podem ver usuários da mesma empresa" ON public.users;
DROP POLICY IF EXISTS "Usuários podem atualizar próprios dados" ON public.users;
DROP POLICY IF EXISTS "Admins podem gerenciar usuários da mesma empresa" ON public.users;

-- Criar políticas mais simples que não causam recursão
CREATE POLICY "Super admins acesso completo"
ON public.users
FOR ALL
USING (
  -- Verificar se é super admin usando auth.uid() diretamente
  EXISTS (
    SELECT 1 FROM auth.users au
    JOIN public.users pu ON au.id = pu.id
    WHERE au.id = auth.uid() 
    AND pu.role = 'admin' 
    AND pu.company_id IS NULL
  )
);

CREATE POLICY "Usuarios mesma empresa"
ON public.users
FOR SELECT
USING (
  -- Super admins veem tudo
  EXISTS (
    SELECT 1 FROM auth.users au
    JOIN public.users pu ON au.id = pu.id
    WHERE au.id = auth.uid() 
    AND pu.role = 'admin' 
    AND pu.company_id IS NULL
  ) OR
  -- Usuários veem da mesma empresa
  company_id IN (
    SELECT company_id FROM public.users WHERE id = auth.uid()
  )
);

CREATE POLICY "Usuarios podem atualizar proprios dados"
ON public.users
FOR UPDATE
USING (id = auth.uid());

CREATE POLICY "Admins empresa podem gerenciar"
ON public.users
FOR ALL
USING (
  -- Admin da mesma empresa (não super admin)
  company_id IN (
    SELECT pu.company_id FROM public.users pu
    WHERE pu.id = auth.uid() 
    AND pu.role = 'admin' 
    AND pu.company_id IS NOT NULL
    AND pu.status = 'ativo'
  )
);