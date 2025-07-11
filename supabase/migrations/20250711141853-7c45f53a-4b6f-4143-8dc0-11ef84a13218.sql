-- Criar função para lidar com mudanças de status do usuário
CREATE OR REPLACE FUNCTION public.handle_auth_user_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o email foi confirmado ou se é o primeiro login
  IF (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL) 
     OR (NEW.last_sign_in_at IS NOT NULL AND OLD.last_sign_in_at IS NULL) THEN
    
    -- Atualizar status do usuário para 'ativo' se estiver 'pendente'
    UPDATE public.users 
    SET status = 'ativo'
    WHERE id = NEW.id AND status = 'pendente';
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger na tabela auth.users
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_update();