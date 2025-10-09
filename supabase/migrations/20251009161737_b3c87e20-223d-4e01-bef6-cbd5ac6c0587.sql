-- Deletar Rafael Monhé do auth.users também
DO $$
BEGIN
  -- Tentar deletar do auth.users usando a extension pg_net para chamar a API admin
  -- Como não podemos deletar diretamente do auth.users via SQL, 
  -- vamos precisar fazer isso manualmente ou via edge function
  
  RAISE NOTICE 'O usuário rafaelmothe.imoveis@gmail.com precisa ser deletado manualmente do Supabase Auth';
  RAISE NOTICE 'Acesse: https://supabase.com/dashboard/project/loxpoehsddfearnzcdla/auth/users';
  RAISE NOTICE 'Busque por: rafaelmothe.imoveis@gmail.com';
  RAISE NOTICE 'E delete o usuário da interface de autenticação';
END $$;