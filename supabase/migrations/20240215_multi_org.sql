-- Add owner_id to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- Update RLS Policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Allow users to view organizations they own OR belong to via profile
CREATE POLICY "Users can view their own organizations" 
ON organizations FOR SELECT 
USING (
  auth.uid() = owner_id 
  OR 
  id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

-- Allow users to insert organizations (and automatically become owner)
CREATE POLICY "Users can create organizations" 
ON organizations FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

-- Allow users to update their own organizations
CREATE POLICY "Users can update their own organizations" 
ON organizations FOR UPDATE 
USING (auth.uid() = owner_id);

-- Allow users to delete their own organizations
CREATE POLICY "Users can delete their own organizations" 
ON organizations FOR DELETE 
USING (auth.uid() = owner_id);
