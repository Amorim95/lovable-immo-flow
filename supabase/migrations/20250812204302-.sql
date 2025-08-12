-- Remover TODAS as políticas da tabela users e recriar sem recursão
DROP POLICY IF EXISTS "Super admin chel acesso total" ON public.users;
DROP POLICY IF EXISTS "Super admin rhenan acesso total" ON public.users;
DROP POLICY IF EXISTS "Usuarios ver mesma empresa" ON public.users;
DROP POLICY IF EXISTS "Update proprio perfil" ON public.users;

-- Desabilitar RLS temporariamente para super admins específicos
-- Criar políticas ultra-simples usando apenas auth.uid()
CREATE POLICY "Chel super admin completo"
ON public.users
FOR ALL
USING (auth.uid() = '40257dfa-1a8e-4c15-a8f7-2cb99cfa4f08'::uuid);

-- Para rhenan, buscar seu ID primeiro
DO $$
DECLARE
    rhenan_id UUID;
BEGIN
    SELECT id INTO rhenan_id FROM public.users WHERE email = 'rhenan644@gmail.com';
    
    IF rhenan_id IS NOT NULL THEN
        EXECUTE format('CREATE POLICY "Rhenan super admin completo" ON public.users FOR ALL USING (auth.uid() = %L::uuid)', rhenan_id);
    END IF;
END $$;

-- Política básica para permitir usuários verem seus próprios dados
CREATE POLICY "Ver proprio perfil"
ON public.users
FOR SELECT
USING (id = auth.uid());

-- Política para usuários atualizarem seus próprios dados
CREATE POLICY "Atualizar proprio perfil"
ON public.users
FOR UPDATE
USING (id = auth.uid());

-- Política para permitir inserção (necessária para novos usuários)
CREATE POLICY "Permitir inserção"
ON public.users
FOR INSERT
WITH CHECK (true);