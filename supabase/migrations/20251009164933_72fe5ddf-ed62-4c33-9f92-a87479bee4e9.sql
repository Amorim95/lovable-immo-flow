-- Modificar constraint da tabela leads para permitir SET NULL

-- 1. Primeiro, tornar user_id nullable (necessário para SET NULL funcionar)
ALTER TABLE public.leads 
ALTER COLUMN user_id DROP NOT NULL;

-- 2. Remover a constraint existente
ALTER TABLE public.leads 
DROP CONSTRAINT IF EXISTS leads_user_id_fkey;

-- 3. Recriar a constraint com ON DELETE SET NULL
ALTER TABLE public.leads 
ADD CONSTRAINT leads_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.users(id) 
ON DELETE SET NULL;

-- 4. Comentário para documentação
COMMENT ON COLUMN public.leads.user_id IS 'ID do usuário responsável pelo lead. Pode ser NULL se o usuário foi deletado (lead órfão).';