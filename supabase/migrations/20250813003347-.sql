-- Fix foreign key constraint to allow cascade deletion
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_company_id_fkey;

ALTER TABLE public.users 
ADD CONSTRAINT users_company_id_fkey 
FOREIGN KEY (company_id) 
REFERENCES public.companies(id) 
ON DELETE CASCADE;