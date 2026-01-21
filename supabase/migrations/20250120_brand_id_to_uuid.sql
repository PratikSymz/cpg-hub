-- Migration: Convert brand_id from text to UUID with foreign key reference

-- First, set any invalid UUIDs to NULL to prevent conversion errors
UPDATE job_listings
SET brand_id = NULL
WHERE brand_id IS NOT NULL
  AND brand_id !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';

-- Drop ALL RLS policies on job_listings that might depend on brand_id
DROP POLICY IF EXISTS "Brand owners can view all their jobs" ON job_listings;
DROP POLICY IF EXISTS "Authenticated users can create jobs" ON job_listings;
DROP POLICY IF EXISTS "Brand owners can update their jobs" ON job_listings;
DROP POLICY IF EXISTS "Brand owners can delete their jobs" ON job_listings;
DROP POLICY IF EXISTS "Anyone can view open jobs" ON job_listings;
DROP POLICY IF EXISTS "Posters can manage their jobs" ON job_listings;

-- Convert brand_id from text to UUID
ALTER TABLE job_listings
ALTER COLUMN brand_id TYPE UUID USING brand_id::uuid;

-- Recreate the RLS policies using Clerk JWT claims
-- Get Clerk user ID from JWT: (current_setting('request.jwt.claims', true)::json->>'sub')

-- Anyone can view open jobs
CREATE POLICY "Anyone can view open jobs"
ON job_listings FOR SELECT
USING (is_open = true);

-- Brand owners can view all their jobs (including closed)
CREATE POLICY "Brand owners can view all their jobs"
ON job_listings FOR SELECT
USING (
  brand_id IN (
    SELECT id FROM brand_profiles
    WHERE user_id = (current_setting('request.jwt.claims', true)::json->>'sub')
  )
);

-- Authenticated users can create jobs
CREATE POLICY "Authenticated users can create jobs"
ON job_listings FOR INSERT
WITH CHECK (
  (current_setting('request.jwt.claims', true)::json->>'sub') IS NOT NULL
);

-- Brand owners can update their jobs
CREATE POLICY "Brand owners can update their jobs"
ON job_listings FOR UPDATE
USING (
  brand_id IN (
    SELECT id FROM brand_profiles
    WHERE user_id = (current_setting('request.jwt.claims', true)::json->>'sub')
  )
);

-- Brand owners can delete their jobs
CREATE POLICY "Brand owners can delete their jobs"
ON job_listings FOR DELETE
USING (
  brand_id IN (
    SELECT id FROM brand_profiles
    WHERE user_id = (current_setting('request.jwt.claims', true)::json->>'sub')
  )
);

-- Add foreign key constraint
ALTER TABLE job_listings
ADD CONSTRAINT fk_job_listings_brand
FOREIGN KEY (brand_id) REFERENCES brand_profiles(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_job_listings_brand_id
ON job_listings(brand_id);
