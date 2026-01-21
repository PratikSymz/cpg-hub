-- Migration: Initial schema setup for CPG Hub
-- Creates all core tables with proper relationships

-- ============================================
-- USER PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  profile_picture_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view all profiles
CREATE POLICY "Anyone can view user profiles"
ON user_profiles FOR SELECT
USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON user_profiles FOR INSERT
WITH CHECK (true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON user_profiles FOR UPDATE
USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

-- ============================================
-- BRAND PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS brand_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  website TEXT,
  linkedin_url TEXT,
  brand_hq TEXT,
  logo_url TEXT,
  brand_desc TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups by user_id (supports multiple brands per user)
CREATE INDEX IF NOT EXISTS idx_brand_profiles_user_id
ON brand_profiles(user_id);

-- Enable RLS
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can view brands
CREATE POLICY "Anyone can view brands"
ON brand_profiles FOR SELECT
USING (true);

-- Authenticated users can create brands
CREATE POLICY "Authenticated users can create brands"
ON brand_profiles FOR INSERT
WITH CHECK (
  (current_setting('request.jwt.claims', true)::json->>'sub') IS NOT NULL
);

-- Brand owners can update their brands
CREATE POLICY "Brand owners can update their brands"
ON brand_profiles FOR UPDATE
USING (
  user_id = (current_setting('request.jwt.claims', true)::json->>'sub')
);

-- Brand owners can delete their brands
CREATE POLICY "Brand owners can delete their brands"
ON brand_profiles FOR DELETE
USING (
  user_id = (current_setting('request.jwt.claims', true)::json->>'sub')
);

-- ============================================
-- JOB LISTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS job_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Poster info (denormalized for performance)
  poster_id TEXT,
  poster_type TEXT DEFAULT 'brand' CHECK (poster_type IN ('brand', 'talent', 'service')),
  poster_name TEXT,
  poster_logo TEXT,
  poster_location TEXT,
  -- Brand reference (for brand-posted jobs)
  brand_id UUID REFERENCES brand_profiles(id) ON DELETE SET NULL,
  -- Job details
  job_title TEXT NOT NULL,
  job_description TEXT,
  preferred_experience TEXT,
  level_of_experience TEXT,
  work_location TEXT,
  scope_of_work TEXT,
  estimated_hrs_per_wk TEXT,
  area_of_specialization TEXT,
  is_open BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_job_listings_brand_id ON job_listings(brand_id);
CREATE INDEX IF NOT EXISTS idx_job_listings_poster_id ON job_listings(poster_id);
CREATE INDEX IF NOT EXISTS idx_job_listings_is_open ON job_listings(is_open);

-- Enable RLS
ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;

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

-- ============================================
-- SAVED JOBS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

-- Enable RLS
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

-- Users can view their own saved jobs
CREATE POLICY "Users can view their own saved jobs"
ON saved_jobs FOR SELECT
USING (
  user_id = (current_setting('request.jwt.claims', true)::json->>'sub')
);

-- Users can save jobs
CREATE POLICY "Users can save jobs"
ON saved_jobs FOR INSERT
WITH CHECK (
  user_id = (current_setting('request.jwt.claims', true)::json->>'sub')
);

-- Users can unsave jobs
CREATE POLICY "Users can unsave jobs"
ON saved_jobs FOR DELETE
USING (
  user_id = (current_setting('request.jwt.claims', true)::json->>'sub')
);
