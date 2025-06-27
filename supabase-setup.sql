-- Supabase table setup for founder-brand
-- Run this in your Supabase SQL editor to create the required tables

-- Create user_contexts table for personal context and global rules
CREATE TABLE IF NOT EXISTS user_contexts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create custom_prompts table for custom prompt templates
CREATE TABLE IF NOT EXISTS custom_prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  name TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  style_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_contexts_content ON user_contexts(content);
CREATE INDEX IF NOT EXISTS idx_user_contexts_created_at ON user_contexts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_prompts_user_id ON custom_prompts(user_id);

-- Enable Row Level Security (optional, for multi-user apps)
-- ALTER TABLE user_contexts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE custom_prompts ENABLE ROW LEVEL SECURITY;

-- Create policies (optional, uncomment if you enable RLS)
-- CREATE POLICY "Users can view their own contexts" ON user_contexts
--   FOR SELECT USING (auth.uid()::text = user_id);
-- CREATE POLICY "Users can insert their own contexts" ON user_contexts
--   FOR INSERT WITH CHECK (auth.uid()::text = user_id);
-- CREATE POLICY "Users can update their own contexts" ON user_contexts
--   FOR UPDATE USING (auth.uid()::text = user_id);
-- CREATE POLICY "Users can delete their own contexts" ON user_contexts
--   FOR DELETE USING (auth.uid()::text = user_id);