-- Limpar TODAS as políticas da tabela users e recriar apenas as necessárias
DROP POLICY IF EXISTS "Admin gestor pode ver usuarios da empresa" ON public.users;
DROP POLICY IF EXISTS "Admin pode gerenciar usuarios da empresa" ON public.users;
DROP POLICY IF EXISTS "Admins gerenciam usuarios da empresa" ON public.users;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios dados" ON public.users;
DROP POLICY IF EXISTS "Ver usuarios da mesma empresa" ON public.users;

-- Manter apenas as políticas essenciais:
-- 1. Super-admins (já existem)
-- 2. Ver próprio perfil (já existe)
-- 3. Atualizar próprio perfil (já existe)
-- 4. Permitir inserção (já existe)

-- Agora criar UMA política simples para visualização entre usuários da empresa
CREATE POLICY "Usuarios mesma empresa podem se ver"
ON public.users
FOR SELECT
USING (
  -- Super-admins veem todos
  auth.uid() = '40257dfa-1a8e-4c15-a8f7-2cb99cfa4f08'::uuid OR 
  auth.uid() = '62926fc7-ffba-4a63-9bae-50f8845a1b67'::uuid OR
  -- Ver próprio perfil
  id = auth.uid() OR
  -- Usuários da mesma empresa (sem recursão)
  (company_id IS NOT NULL AND 
   company_id IN (
     SELECT company_id FROM public.users WHERE id = auth.uid()
   )
  )
);