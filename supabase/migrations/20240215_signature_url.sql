-- Add signature_url column to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS signature_url TEXT;

-- Create storage bucket for organization assets if it doesn't exist (or we use existing)
-- We'll assume 'organization-logos' exists, let's create 'organization-assets' or just use 'organization-logos' for simplicity but maybe rename it conceptually? 
-- For now, let's just stick to adding the column. Storage policy is separate.
