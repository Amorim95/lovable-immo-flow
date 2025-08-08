-- Criar políticas de storage para uploads de logo da empresa
-- Permitir que usuários autenticados façam upload de arquivos
CREATE POLICY "Allow authenticated users to upload files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'property-media' 
  AND auth.role() = 'authenticated'
);

-- Permitir que todos vejam os arquivos públicos (para exibir logos)
CREATE POLICY "Allow public access to files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'property-media');

-- Permitir que usuários autenticados atualizem seus próprios arquivos
CREATE POLICY "Allow authenticated users to update files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'property-media' 
  AND auth.role() = 'authenticated'
);

-- Permitir que usuários autenticados deletem arquivos (para remover logos antigas)
CREATE POLICY "Allow authenticated users to delete files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'property-media' 
  AND auth.role() = 'authenticated'
);