-- Create function to update timestamps if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create peer_learning_profiles table for matching users based on skills
CREATE TABLE IF NOT EXISTS public.peer_learning_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  skills TEXT[] DEFAULT '{}',
  experience_level TEXT DEFAULT 'intermediate',
  preferred_topics TEXT[] DEFAULT '{}',
  bio TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.peer_learning_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all active peer learning profiles"
  ON public.peer_learning_profiles
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can insert their own peer learning profile"
  ON public.peer_learning_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own peer learning profile"
  ON public.peer_learning_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own peer learning profile"
  ON public.peer_learning_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_peer_learning_profiles_user_id ON public.peer_learning_profiles(user_id);
CREATE INDEX idx_peer_learning_profiles_is_active ON public.peer_learning_profiles(is_active);

-- Trigger for updated_at
CREATE TRIGGER update_peer_learning_profiles_updated_at
  BEFORE UPDATE ON public.peer_learning_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();