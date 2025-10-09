
-- Remover verificação de status das políticas RLS
-- Isso permite que usuários inativos façam login e acessem o sistema

-- Atualizar política de campanhas
DROP POLICY IF EXISTS "Usuários ativos podem ver campanhas" ON campaigns;

CREATE POLICY "Usuários autenticados podem ver campanhas"
ON campaigns
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
  )
);

-- Comentário: Removida a verificação de status = 'ativo'
-- Agora qualquer usuário autenticado pode ver campanhas, independente do status
