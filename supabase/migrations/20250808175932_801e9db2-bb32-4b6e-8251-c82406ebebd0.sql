-- Fix RLS policies for property media to follow security best practices
DROP POLICY IF EXISTS "Users can upload property media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own property media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own property media" ON storage.objects;

-- Create more secure policies with proper path-based access control
CREATE POLICY "Users can upload their own property media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'property-media' 
  AND auth.uid() IS NOT NULL 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own property media" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'property-media' 
  AND auth.uid() IS NOT NULL 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own property media" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'property-media' 
  AND auth.uid() IS NOT NULL 
  AND (storage.foldername(name))[1] = auth.uid()::text
);