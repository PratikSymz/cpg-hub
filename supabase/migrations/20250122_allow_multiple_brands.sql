-- Migration: Allow multiple brands per user
-- Removes the unique constraint on user_id to allow users to create multiple brands

-- Drop the unique constraint on user_id (allows multiple brands per user)
ALTER TABLE brand_profiles
DROP CONSTRAINT IF EXISTS brand_profiles_user_id_key;

-- Add an index for faster lookups by user_id (non-unique)
CREATE INDEX IF NOT EXISTS idx_brand_profiles_user_id
ON brand_profiles(user_id);
