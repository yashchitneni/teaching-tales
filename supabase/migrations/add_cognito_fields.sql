-- Add Cognito-related fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS cognito_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'parent' CHECK (role IN ('parent', 'admin'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_cognito_id ON profiles(cognito_id);

-- Update existing records to have a default role
UPDATE profiles 
SET role = 'parent' 
WHERE role IS NULL;

-- Add OneRoster fields if they don't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS oneroster_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS primary_org_id VARCHAR(255);

-- Note: We already have a 'children' table for parent-child relationships
-- No need to create a new relationship table