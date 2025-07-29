-- Listar todas as políticas da tabela users
SELECT schemaname, tablename, policyname, cmd, qual FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public';