/*
  # Create jobs and applications tables

  1. New Tables
    - `jobs` — Job postings created by hirers with category, budget, location, status
    - `applications` — Provider applications/proposals to jobs

  2. Security
    - Enable RLS on all tables
    - Open jobs readable by all; draft jobs only by owner
    - Hirers manage their own jobs
    - Applications readable by the provider or the job's hirer
    - Providers can insert their own applications
*/

-- JOBS
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hirer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  location_text TEXT DEFAULT '',
  city TEXT DEFAULT '',
  pincode TEXT DEFAULT '',
  lat DECIMAL(10,8),
  lng DECIMAL(11,8),
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  budget_type TEXT CHECK (budget_type IN ('hourly', 'daily', 'project', 'negotiable')) DEFAULT 'negotiable',
  duration TEXT,
  start_date DATE,
  status TEXT CHECK (status IN ('draft','open','in_progress','completed','cancelled','disputed')) DEFAULT 'open',
  ai_extracted_data JSONB DEFAULT '{}',
  views_count INT DEFAULT 0,
  applications_count INT DEFAULT 0,
  hired_provider_id UUID REFERENCES provider_profiles(id),
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- APPLICATIONS
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES provider_profiles(id) ON DELETE CASCADE,
  cover_letter TEXT DEFAULT '',
  proposed_amount DECIMAL(10,2),
  proposed_timeline TEXT,
  status TEXT CHECK (status IN ('pending','shortlisted','rejected','hired')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, provider_id)
);

-- RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Open jobs readable" ON jobs FOR SELECT USING (status != 'draft' OR hirer_id = auth.uid());
CREATE POLICY "Hirer manages jobs" ON jobs FOR ALL USING (hirer_id = auth.uid());

CREATE POLICY "Applications readable by parties" ON applications FOR SELECT USING (
  provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid())
  OR job_id IN (SELECT id FROM jobs WHERE hirer_id = auth.uid())
);
CREATE POLICY "Providers can apply" ON applications FOR INSERT WITH CHECK (
  provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Providers update own applications" ON applications FOR UPDATE USING (
  provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid())
);
