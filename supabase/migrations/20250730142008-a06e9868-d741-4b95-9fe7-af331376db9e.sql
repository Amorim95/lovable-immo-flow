-- Permitir que Administradores e Gestores gerenciem usuários e equipes completamente

-- Política para permitir que admins e gestores atualizem qualquer usuário
CREATE POLICY "Admins e gestores podem atualizar qualquer usuário"
ON public.users
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() 
    AND u.status = 'ativo'
    AND (u.role = 'admin' OR u.role = 'gestor')
  )
);

-- Política para permitir que usuários atualizem seus próprios dados
CREATE POLICY "Usuários podem atualizar seus próprios dados"
ON public.users
FOR UPDATE
USING (id = auth.uid());

-- Política para permitir que admins e gestores deletem usuários (alterar status para inativo)
CREATE POLICY "Admins e gestores podem deletar usuários"
ON public.users
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() 
    AND u.status = 'ativo'
    AND (u.role = 'admin' OR u.role = 'gestor')
  )
);

-- Política para permitir que gestores vejam e editem equipes da mesma equipe ou todas (se admin)
DROP POLICY IF EXISTS "Admins podem deletar equipes" ON public.equipes;

CREATE POLICY "Admins e gestores podem deletar equipes"
ON public.equipes
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() 
    AND u.status = 'ativo'
    AND (u.role = 'admin' OR u.role = 'gestor')
  )
);