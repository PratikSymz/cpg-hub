-- Migration: Convert brand_id from TEXT to UUID in production

-- First, set any invalid UUIDs to NULL to prevent conversion errors
-- Cast brand_id to text explicitly for the regex comparison
UPDATE job_listings
SET brand_id = NULL
WHERE brand_id IS NOT NULL
  AND brand_id::text !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';

-- Drop existing RLS policies that might reference brand_id
DROP POLICY IF EXISTS "Brand owners can view all their jobs" ON job_listings;
DROP POLICY IF EXISTS "Authenticated users can create jobs" ON job_listings;
DROP POLICY IF EXISTS "Brand owners can update their jobs" ON job_listings;
DROP POLICY IF EXISTS "Brand owners can delete their jobs" ON job_listings;
DROP POLICY IF EXISTS "Anyone can view open jobs" ON job_listings;

-- Drop any existing foreign key constraint
ALTER TABLE job_listings DROP CONSTRAINT IF EXISTS fk_job_listings_brand;
ALTER TABLE job_listings DROP CONSTRAINT IF EXISTS job_listings_brand_id_fkey;

-- Convert brand_id from TEXT to UUID
ALTER TABLE job_listings
ALTER COLUMN brand_id TYPE UUID USING brand_id::uuid;

-- Add foreign key constraint
ALTER TABLE job_listings
ADD CONSTRAINT fk_job_listings_brand
FOREIGN KEY (brand_id) REFERENCES brand_profiles(id) ON DELETE SET NULL;

-- Recreate RLS policies
CREATE POLICY "Anyone can view open jobs"
ON job_listings FOR SELECT
USING (is_open = true);

CREATE POLICY "Brand owners can view all their jobs"
ON job_listings FOR SELECT
USING (
  brand_id IN (
    SELECT id FROM brand_profiles
    WHERE user_id = (current_setting('request.jwt.claims', true)::json->>'sub')
  )
);

CREATE POLICY "Authenticated users can create jobs"
ON job_listings FOR INSERT
WITH CHECK (
  (current_setting('request.jwt.claims', true)::json->>'sub') IS NOT NULL
);

CREATE POLICY "Brand owners can update their jobs"
ON job_listings FOR UPDATE
USING (
  brand_id IN (
    SELECT id FROM brand_profiles
    WHERE user_id = (current_setting('request.jwt.claims', true)::json->>'sub')
  )
);

CREATE POLICY "Brand owners can delete their jobs"
ON job_listings FOR DELETE
USING (
  brand_id IN (
    SELECT id FROM brand_profiles
    WHERE user_id = (current_setting('request.jwt.claims', true)::json->>'sub')
  )
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_job_listings_brand_id ON job_listings(brand_id);
