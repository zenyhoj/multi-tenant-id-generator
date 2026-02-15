-- Add owner_id to organizations table (if not exists)
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- Update RLS Policies (Drop first to avoid errors)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own organizations" ON organizations;
CREATE POLICY "Users can view their own organizations" 
ON organizations FOR SELECT 
USING (
  auth.uid() = owner_id 
  OR 
  id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
CREATE POLICY "Users can create organizations" 
ON organizations FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own organizations" ON organizations;
CREATE POLICY "Users can update their own organizations" 
ON organizations FOR UPDATE 
USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete their own organizations" ON organizations;
CREATE POLICY "Users can delete their own organizations" 
ON organizations FOR DELETE 
USING (auth.uid() = owner_id);
