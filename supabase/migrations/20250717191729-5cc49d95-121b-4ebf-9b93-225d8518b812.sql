-- Primeiro, buscar IDs das equipes que queremos deletar
-- DELETE FROM public.users WHERE equipe_id IN (
--   SELECT id FROM public.equipes WHERE nome IN ('Equipe Zona Sul', 'Equipe Barra')
-- );

-- Limpeza de dados de teste - primeiro usuários, depois equipes
DELETE FROM public.users WHERE email = 'admin.teste@example.com';

-- Buscar e deletar usuários que estão nas equipes que queremos remover
DELETE FROM public.users WHERE equipe_id IN (
  SELECT id FROM public.equipes WHERE nome IN ('Equipe Zona Sul', 'Equipe Barra')
);

-- Agora deletar as equipes
DELETE FROM public.equipes WHERE nome IN ('Equipe Zona Sul', 'Equipe Barra');