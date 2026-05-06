/*
  # Create provider-related tables

  1. New Tables
    - `provider_profiles` — Extended profile for service providers with bio, rates, ratings
    - `provider_categories` — Many-to-many linking providers to service categories
    - `portfolio_items` — Provider portfolio images/documents

  2. Security
    - Enable RLS on all tables
    - Provider profiles readable by all
    - Providers can manage their own profile
    - Portfolio items follow provider ownership
*/

-- PROVIDER PROFILES
CREATE TABLE IF NOT EXISTS public.provider_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  bio TEXT DEFAULT '',
  tagline TEXT DEFAULT '',
  experience_years INT DEFAULT 0,
  rate_hourly DECIMAL(10,2),
  rate_daily DECIMAL(10,2),
  rate_project_min DECIMAL(10,2),
  rate_project_max DECIMAL(10,2),
  availability TEXT CHECK (availability IN ('immediate', 'within_week', 'custom')) DEFAULT 'immediate',
  languages TEXT[] DEFAULT ARRAY['Hindi', 'English'],
  service_radius_km INT DEFAULT 20,
  total_jobs_done INT DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0.00,
  review_count INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  kyc_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROVIDER CATEGORIES (M2M)
CREATE TABLE IF NOT EXISTS public.provider_categories (
  provider_id UUID REFERENCES provider_profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (provider_id, category_id)
);

-- PORTFOLIO ITEMS
CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES provider_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'pdf', 'video')) DEFAULT 'image',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provider profiles readable" ON provider_profiles FOR SELECT USING (true);
CREATE POLICY "Own provider profile manageable" ON provider_profiles FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Provider categories readable" ON provider_categories FOR SELECT USING (true);
CREATE POLICY "Own provider categories manageable" ON provider_categories FOR ALL USING (
  provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Portfolio items readable" ON portfolio_items FOR SELECT USING (true);
CREATE POLICY "Own portfolio items manageable" ON portfolio_items FOR ALL USING (
  provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid())
);
