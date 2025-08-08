-- Create storage buckets for property media
INSERT INTO storage.buckets (id, name, public) VALUES ('property-media', 'property-media', true);

-- Create policies for property media uploads
CREATE POLICY "Users can upload property media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'property-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view property media" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'property-media');

CREATE POLICY "Users can update their own property media" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'property-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own property media" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'property-media' AND auth.uid() IS NOT NULL);