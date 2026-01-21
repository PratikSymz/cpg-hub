-- Migration: Update job_listings for poster-agnostic job posting

-- Step 1: Add new columns (poster_id is TEXT to match user_profiles.user_id)
ALTER TABLE job_listings
ADD COLUMN IF NOT EXISTS poster_id TEXT,
ADD COLUMN IF NOT EXISTS poster_type TEXT DEFAULT 'brand',
ADD COLUMN IF NOT EXISTS poster_name TEXT,
ADD COLUMN IF NOT EXISTS poster_logo TEXT,
ADD COLUMN IF NOT EXISTS poster_location TEXT;

-- Step 2: Migrate existing data (copy brand info to new columns)
UPDATE job_listings j
SET
  poster_id = j.brand_id,
  poster_type = 'brand',
  poster_name = b.brand_name,
  poster_logo = b.logo_url,
  poster_location = b.brand_hq
FROM brand_profiles b
WHERE j.brand_id = b.user_id
  AND j.poster_id IS NULL;

-- Step 3: Add constraint for poster_type (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_poster_type'
  ) THEN
    ALTER TABLE job_listings
    ADD CONSTRAINT valid_poster_type
    CHECK (poster_type IN ('brand', 'talent', 'service'));
  END IF;
END $$;
