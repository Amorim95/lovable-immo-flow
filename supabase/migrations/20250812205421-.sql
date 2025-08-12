-- Criar políticas simples sem recursão
-- Super-admin Chel
CREATE POLICY "Chel super admin completo"
ON public.users
FOR ALL
USING (auth.uid() = '40257dfa-1a8e-4c15-a8f7-2cb99cfa4f08'::uuid);

-- Super-admin Rhenan  
CREATE POLICY "Rhenan super admin completo"
ON public.users
FOR ALL
USING (auth.uid() = '62926fc7-ffba-4a63-9bae-50f8845a1b67'::uuid);

-- Usuários podem ver seu próprio perfil
CREATE POLICY "Ver proprio perfil"
ON public.users
FOR SELECT
USING (id = auth.uid());

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Atualizar proprio perfil"
ON public.users
FOR UPDATE
USING (id = auth.uid());

-- Permitir inserção para service role
CREATE POLICY "Permitir inserção"
ON public.users
FOR INSERT
WITH CHECK (true);