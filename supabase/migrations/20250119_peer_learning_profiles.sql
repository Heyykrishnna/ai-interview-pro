-- Create peer_learning_profiles table
CREATE TABLE IF NOT EXISTS peer_learning_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skills JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of skills the user wants to practice
  experience_level TEXT NOT NULL CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  preferred_topics JSONB DEFAULT '[]'::jsonb, -- Array of preferred interview topics
  availability JSONB DEFAULT '[]'::jsonb, -- Array of available time slots
  bio TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for faster skill matching
CREATE INDEX IF NOT EXISTS idx_peer_learning_profiles_skills ON peer_learning_profiles USING GIN (skills);
CREATE INDEX IF NOT EXISTS idx_peer_learning_profiles_user_id ON peer_learning_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_peer_learning_profiles_active ON peer_learning_profiles(is_active) WHERE is_active = true;

-- Add skills column to peer_interview_sessions
ALTER TABLE peer_interview_sessions 
ADD COLUMN IF NOT EXISTS required_skills JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS matched_by_system BOOLEAN DEFAULT false;

-- Create peer_match_requests table for tracking match requests
CREATE TABLE IF NOT EXISTS peer_match_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES peer_interview_sessions(id) ON DELETE CASCADE,
  requested_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'expired', 'cancelled')),
  matched_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS idx_peer_match_requests_requester ON peer_match_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_peer_match_requests_status ON peer_match_requests(status);

-- Enable RLS
ALTER TABLE peer_learning_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_match_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for peer_learning_profiles
CREATE POLICY "Users can view all active peer learning profiles"
  ON peer_learning_profiles FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can insert their own peer learning profile"
  ON peer_learning_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own peer learning profile"
  ON peer_learning_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own peer learning profile"
  ON peer_learning_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for peer_match_requests
CREATE POLICY "Users can view their own match requests"
  ON peer_match_requests FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = matched_user_id);

CREATE POLICY "Users can create match requests"
  ON peer_match_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update their own match requests"
  ON peer_match_requests FOR UPDATE
  USING (auth.uid() = requester_id);
