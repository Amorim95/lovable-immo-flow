-- Ativar a conta do usuário administrador para permitir salvar configurações
UPDATE public.users 
SET status = 'ativo' 
WHERE id = '62926fc7-ffba-4a63-9bae-50f8845a1b67';