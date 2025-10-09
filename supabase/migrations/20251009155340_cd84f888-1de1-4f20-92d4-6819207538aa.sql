
-- Habilitar extensão pg_net se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Resetar senha do Rafael Monhé para "mudar123"
DO $$
DECLARE
  request_id bigint;
BEGIN
  -- Fazer requisição HTTP para a edge function
  SELECT net.http_post(
    url := 'https://loxpoehsddfearnzcdla.supabase.co/functions/v1/reset-user-password',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"email": "rafaelmothe.imoveis@gmail.com", "newPassword": "mudar123"}'::jsonb
  ) INTO request_id;
  
  RAISE NOTICE 'Requisição enviada para resetar senha do Rafael. Request ID: %', request_id;
END $$;
