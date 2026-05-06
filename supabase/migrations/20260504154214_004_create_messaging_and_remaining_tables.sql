/*
  # Create messaging, AI sessions, transactions, reviews, notifications, boosts tables

  1. New Tables
    - `conversations` — Chat threads between hirer and provider about a job
    - `messages` — Individual messages within conversations
    - `ai_sessions` — AI chat session state and extracted data
    - `transactions` — Payment records with escrow status
    - `reviews` — Post-job ratings and reviews between parties
    - `notifications` — In-app notifications for users
    - `boosts` — Paid provider profile boosts

  2. Security
    - RLS enabled on all tables
    - Conversations/messages only accessible by participants
    - AI sessions only by owner
    - Transactions by involved parties
    - Reviews publicly readable, insertable by reviewer
    - Notifications by owner only
*/

-- CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id),
  hirer_id UUID REFERENCES profiles(id),
  provider_id UUID REFERENCES profiles(id),
  last_message TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  hirer_unread INT DEFAULT 0,
  provider_unread INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, hirer_id, provider_id)
);

-- MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  media_url TEXT,
  is_ai_message BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI SESSIONS
CREATE TABLE IF NOT EXISTS public.ai_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  session_type TEXT CHECK (session_type IN ('job_intake','profile_setup','proposal_gen','support')) DEFAULT 'job_intake',
  messages JSONB DEFAULT '[]',
  extracted_data JSONB,
  status TEXT CHECK (status IN ('active','completed','abandoned')) DEFAULT 'active',
  tokens_used INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id),
  hirer_id UUID REFERENCES profiles(id),
  provider_id UUID REFERENCES provider_profiles(id),
  amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  provider_payout DECIMAL(10,2) NOT NULL,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  status TEXT CHECK (status IN ('pending','paid','held','released','refunded','disputed')) DEFAULT 'pending',
  held_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  auto_release_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id),
  reviewer_id UUID REFERENCES profiles(id),
  reviewee_id UUID REFERENCES profiles(id),
  rating INT CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  review_text TEXT,
  review_type TEXT CHECK (review_type IN ('hirer_to_provider','provider_to_hirer')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, reviewer_id)
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BOOSTS
CREATE TABLE IF NOT EXISTS public.boosts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES provider_profiles(id),
  boost_type TEXT CHECK (boost_type IN ('profile_featured','category_top')),
  category_id UUID REFERENCES categories(id),
  razorpay_payment_id TEXT,
  amount_paid DECIMAL(10,2),
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE boosts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conversation participants" ON conversations FOR ALL USING (
  hirer_id = auth.uid() OR provider_id = auth.uid()
);

CREATE POLICY "Message participants" ON messages FOR ALL USING (
  conversation_id IN (
    SELECT id FROM conversations
    WHERE hirer_id = auth.uid() OR provider_id = auth.uid()
  )
);

CREATE POLICY "Own sessions only" ON ai_sessions FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Transaction parties" ON transactions FOR SELECT USING (
  hirer_id = auth.uid() OR
  provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Reviews public readable" ON reviews FOR SELECT USING (true);
CREATE POLICY "Reviewer owns review" ON reviews FOR INSERT WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Own notifications" ON notifications FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Boosts readable" ON boosts FOR SELECT USING (true);
