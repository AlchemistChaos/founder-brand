-- Create user_contexts table for storing personal context data
CREATE TABLE IF NOT EXISTS user_contexts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_contexts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (no auth required)
CREATE POLICY "Allow all operations on user_contexts" 
ON user_contexts FOR ALL 
USING (true) 
WITH CHECK (true);