-- Migration: Allow multiple brands per user
-- Removes the unique constraint on user_id to allow users to create multiple brands

-- First, drop the foreign key on job_listings.brand_id that depends on this constraint
ALTER TABLE job_listings
DROP CONSTRAINT IF EXISTS job_listings_brand_id_fkey;

-- Now we can safely drop the unique constraint
ALTER TABLE brand_profiles
DROP CONSTRAINT IF EXISTS brand_profiles_user_id_key;

-- Add an index for faster lookups by user_id (non-unique)
CREATE INDEX IF NOT EXISTS idx_brand_profiles_user_id
ON brand_profiles(user_id);
