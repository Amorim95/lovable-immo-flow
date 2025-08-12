-- Corrigir políticas RLS da tabela users para garantir login funcionando
-- Remover políticas conflitantes que podem estar causando problemas
DROP POLICY IF EXISTS "Usuarios podem ver usuarios da mesma empresa" ON public.users;
DROP POLICY IF EXISTS "Admins podem gerenciar usuarios da empresa" ON public.users;

-- Recriar políticas mais simples e funcionais
-- Super-admins já existem, mantemos eles

-- Política para usuários verem seu próprio perfil (essencial para login)
-- Esta política já existe, mas vamos garantir que funciona

-- Política para usuários verem outros usuários da mesma empresa
CREATE POLICY "Ver usuarios da mesma empresa"
ON public.users
FOR SELECT
USING (
  -- Super-admins veem tudo
  auth.uid() = '40257dfa-1a8e-4c15-a8f7-2cb99cfa4f08'::uuid OR 
  auth.uid() = '62926fc7-ffba-4a63-9bae-50f8845a1b67'::uuid OR
  -- Usuário vê seu próprio perfil
  id = auth.uid() OR
  -- Usuários da mesma empresa se veem
  (company_id IS NOT NULL AND company_id = get_user_company_id())
);

-- Política para admins gerenciarem usuários da empresa
CREATE POLICY "Admins gerenciam usuarios da empresa"
ON public.users
FOR ALL
USING (
  -- Super-admins fazem tudo
  auth.uid() = '40257dfa-1a8e-4c15-a8f7-2cb99cfa4f08'::uuid OR 
  auth.uid() = '62926fc7-ffba-4a63-9bae-50f8845a1b67'::uuid OR
  -- Admins gerenciam usuários da mesma empresa (sem recursão)
  (company_id IS NOT NULL AND 
   company_id = get_user_company_id() AND
   auth.uid() IN (
     SELECT u.id FROM public.users u 
     WHERE u.role = 'admin' 
     AND u.status = 'ativo' 
     AND u.company_id = get_user_company_id()
   )
  )
);