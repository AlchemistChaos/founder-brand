import { createClient } from '@supabase/supabase-js'

// Client-side environment variables must be prefixed with NEXT_PUBLIC_
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase configuration missing. Personal context features will be disabled.')
}

export const supabaseClient = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null

export interface UserContext {
  id?: string
  content: string
  created_at?: string
}