-- Update the select policy to include organizations with no owner (legacy fix)
DROP POLICY IF EXISTS "Users can view their own organizations" ON organizations;

CREATE POLICY "Users can view their own organizations" 
ON organizations FOR SELECT 
USING (
  auth.uid() = owner_id 
  OR 
  owner_id IS NULL -- Allow seeing orphans so they can be claimed/edited
  OR 
  id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

-- Allow users to update unowned organizations (to claim them)
DROP POLICY IF EXISTS "Users can update their own organizations" ON organizations;

CREATE POLICY "Users can update their own organizations" 
ON organizations FOR UPDATE 
USING (
  auth.uid() = owner_id
  OR
  owner_id IS NULL
)
WITH CHECK (
  auth.uid() = owner_id
  OR
  owner_id IS NULL
);
