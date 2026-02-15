-- Create the storage bucket for organization logos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization-logos', 'organization-logos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policy to allow public viewing of logos
CREATE POLICY "Public Access to Organization Logos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'organization-logos' );

-- Policy to allow authenticated users to upload logos
-- Ideally this should be restricted to organization owners, but for now allow authenticated users to upload to this bucket
CREATE POLICY "Authenticated users can upload organization logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'organization-logos' 
  AND auth.role() = 'authenticated'
);

-- Policy to allow users to update their own uploads (or broadly for now)
CREATE POLICY "Authenticated users can update organization logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'organization-logos' 
  AND auth.role() = 'authenticated'
);
