-- Habilitar RLS na tabela invitations que está desprotegida
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Criar políticas para a tabela invitations
CREATE POLICY "Admins podem gerenciar convites"
ON public.invitations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() 
    AND u.status = 'ativo'
    AND u.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() 
    AND u.status = 'ativo'
    AND u.role = 'admin'
  )
);

-- Permitir acesso público para validação de tokens de convite
CREATE POLICY "Acesso público para validação de convites"
ON public.invitations
FOR SELECT
USING (true);