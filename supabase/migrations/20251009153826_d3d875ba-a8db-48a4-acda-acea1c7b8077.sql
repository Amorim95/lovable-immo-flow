
-- Criar função que sincroniza usuários para auth.users automaticamente
CREATE OR REPLACE FUNCTION public.sync_user_to_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  auth_user_exists BOOLEAN;
  new_auth_user_id UUID;
BEGIN
  -- Verificar se o usuário já existe em auth.users pelo email
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = NEW.email
  ) INTO auth_user_exists;

  IF NOT auth_user_exists THEN
    -- Criar usuário no auth.users usando a API do Supabase
    -- Isso precisa ser feito via edge function ou manualmente
    RAISE NOTICE 'Usuário % precisa ser criado em auth.users', NEW.email;
  END IF;

  RETURN NEW;
END;
$$;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS sync_user_to_auth_trigger ON users;

-- Criar trigger que executa após inserção de usuário
CREATE TRIGGER sync_user_to_auth_trigger
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_to_auth();

-- Agora vamos sincronizar os usuários existentes
-- Criar uma tabela temporária para armazenar usuários que precisam ser sincronizados
CREATE TABLE IF NOT EXISTS public.users_pending_auth_sync (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir usuários que não estão em auth.users
INSERT INTO public.users_pending_auth_sync (id, email, name)
SELECT u.id, u.email, u.name
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users au WHERE au.email = u.email
)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.users_pending_auth_sync IS 'Tabela temporária para rastrear usuários que precisam ser sincronizados com auth.users';
