-- Add org_type and metadata columns to organizations table

ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS org_type TEXT DEFAULT 'education',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Update existing rows to have default type 'education' just in case
UPDATE organizations SET org_type = 'education' WHERE org_type IS NULL;
