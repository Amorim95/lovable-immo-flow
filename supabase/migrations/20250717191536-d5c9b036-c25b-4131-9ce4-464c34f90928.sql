-- Limpeza de dados de teste
DELETE FROM public.equipes WHERE nome IN ('Equipe Zona Sul', 'Equipe Barra');
DELETE FROM public.users WHERE email = 'admin.teste@example.com';