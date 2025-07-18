-- Verificar se o usuário atual existe na tabela users
SELECT id, email, name FROM public.users WHERE id = '62926fc7-ffba-4a63-9bae-50f8845a1b67';

-- Se não existir, sincronizar do auth.users
INSERT INTO public.users (id, email, name, role, status, password_hash)
SELECT 
  a.id,
  a.email,
  COALESCE(a.raw_user_meta_data->>'name', split_part(a.email, '@', 1)) as name,
  'admin'::user_role as role,
  'ativo'::user_status as status,
  'sync'::text as password_hash
FROM auth.users a
WHERE a.id = '62926fc7-ffba-4a63-9bae-50f8845a1b67'
AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = a.id);

-- Criar permissões se não existir
INSERT INTO public.permissions (user_id, can_manage_leads, can_view_reports, can_view_all_leads)
SELECT 
  '62926fc7-ffba-4a63-9bae-50f8845a1b67',
  true,
  true,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.permissions 
  WHERE user_id = '62926fc7-ffba-4a63-9bae-50f8845a1b67'
);