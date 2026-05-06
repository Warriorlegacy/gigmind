/*
  # Create profiles and categories tables

  1. New Tables
    - `profiles` — User profiles extending auth.users with role, location, plan, wallet
    - `categories` — Service categories (real estate, medical, home repair, etc.)

  2. Security
    - Enable RLS on `profiles`
    - Public profiles readable by all
    - Users can only update their own profile
    - Users can only insert their own profile

  3. Triggers
    - Auto-create profile on auth.users INSERT via handle_new_user()
*/

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT CHECK (role IN ('hirer', 'provider', 'both', 'admin')) DEFAULT 'hirer',
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  city TEXT DEFAULT '',
  pincode TEXT DEFAULT '',
  state TEXT DEFAULT '',
  lat DECIMAL(10,8),
  lng DECIMAL(11,8),
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  plan TEXT CHECK (plan IN ('free', 'pro', 'agency')) DEFAULT 'free',
  plan_expires_at TIMESTAMPTZ,
  wallet_balance DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_hindi TEXT,
  icon TEXT DEFAULT '🔧',
  description TEXT,
  ai_system_prompt TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  parent_id UUID REFERENCES categories(id)
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles readable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Own profile editable" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Own profile insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Categories readable" ON categories FOR SELECT USING (true);

-- SEED CATEGORIES
INSERT INTO categories (slug, name, name_hindi, icon, description, sort_order) VALUES
('real-estate', 'Real Estate', 'रियल एस्टेट', '🏠', 'Land purchase, sale, township plots, society flats on rent', 1),
('medical', 'Medical Services', 'चिकित्सा सेवाएं', '🏥', 'Home nurse, caretaker, ward boy, medical assistant', 2),
('home-repair', 'Home Repair', 'घर की मरम्मत', '🔧', 'Plumbing, electrical, carpentry, painting, AC repair', 3),
('office-assistance', 'Office Assistance', 'कार्यालय सहायता', '🏢', 'Admin assistant, data entry, receptionist, virtual assistant', 4),
('interior-design', 'Interior Design', 'इंटीरियर डिजाइन', '🎨', 'Home and office interior design and decoration', 5),
('security', 'Security Services', 'सुरक्षा सेवाएं', '🔐', 'Security guards, CCTV installation, night watchman', 6),
('human-resources', 'Human Resources', 'मानव संसाधन', '👥', 'Recruitment, staffing, HR consulting, payroll', 7),
('cleaning', 'Cleaning Services', 'सफाई सेवाएं', '🧹', 'House cleaning, deep cleaning, office cleaning, sofa cleaning', 8),
('transport', 'Transport & Delivery', 'परिवहन', '🚚', 'Packers and movers, delivery, driver on call', 9),
('education', 'Education & Tutoring', 'शिक्षा', '📚', 'Home tutor, coaching, skill training', 10),
('event-management', 'Event Management', 'इवेंट मैनेजमेंट', '🎉', 'Wedding planning, corporate events, catering', 11),
('it-services', 'IT Services', 'आईटी सेवाएं', '💻', 'Web development, app development, computer repair', 12)
ON CONFLICT (slug) DO NOTHING;
