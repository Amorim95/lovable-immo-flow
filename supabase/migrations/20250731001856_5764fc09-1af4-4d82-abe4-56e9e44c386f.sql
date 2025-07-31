-- Corrigir política de visualização de equipes para permitir admins independente do status

DROP POLICY IF EXISTS "Usuários ativos podem ver equipes" ON public.equipes;

CREATE POLICY "Usuários podem ver equipes conforme permissões" ON public.equipes
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND (
      -- Admin pode ver independente do status
      (u.role = 'admin') OR 
      -- Gestor e corretor precisam estar ativos
      ((u.role = 'gestor' OR u.role = 'corretor') AND u.status = 'ativo')
    )
  )
);