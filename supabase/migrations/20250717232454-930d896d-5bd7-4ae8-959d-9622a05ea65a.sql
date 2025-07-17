-- Sincronizar usuários do auth.users para public.users
INSERT INTO public.users (id, email, name, role, status, password_hash)
SELECT 
  a.id,
  a.email,
  COALESCE(a.raw_user_meta_data->>'name', split_part(a.email, '@', 1)) as name,
  'corretor'::user_role as role,
  CASE 
    WHEN a.email_confirmed_at IS NOT NULL THEN 'ativo'::user_status 
    ELSE 'pendente'::user_status 
  END as status,
  'sync'::text as password_hash -- placeholder pois é obrigatório
FROM auth.users a
LEFT JOIN public.users u ON a.id = u.id
WHERE u.id IS NULL
  AND a.email IS NOT NULL;

-- Criar permissões padrão para usuários sincronizados
INSERT INTO public.permissions (user_id, can_manage_leads, can_view_reports)
SELECT 
  a.id,
  true,
  true
FROM auth.users a
LEFT JOIN public.permissions p ON a.id = p.user_id
LEFT JOIN public.users u ON a.id = u.id
WHERE p.user_id IS NULL 
  AND u.id IS NOT NULL
  AND a.email IS NOT NULL;