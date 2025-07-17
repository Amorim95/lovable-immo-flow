-- Adicionar política RLS para permitir que usuários autenticados vejam seus próprios dados
CREATE POLICY "Usuários autenticados podem ver seu próprio perfil"
ON public.users 
FOR SELECT 
USING (auth.uid() = id);

-- Política para permitir que usuários autenticados atualizem seus próprios dados
CREATE POLICY "Usuários autenticados podem atualizar seu próprio perfil"
ON public.users 
FOR UPDATE 
USING (auth.uid() = id);