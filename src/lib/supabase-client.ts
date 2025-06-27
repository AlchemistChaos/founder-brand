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

// Helper function to get user's personal context
export async function getUserContexts(): Promise<string> {
  if (!supabaseClient) return ''
  
  try {
    const { data, error } = await supabaseClient
      .from('user_contexts')
      .select('content')
      .not('content', 'like', 'GLOBAL_RULES:%')
      .not('content', 'like', 'TONE_EXAMPLE:%')
      .order('created_at', { ascending: false })
      .limit(5)

    if (error || !data || data.length === 0) return ''
    
    return data.map(context => context.content).join('\n\n')
  } catch (error) {
    console.error('Error fetching user contexts:', error)
    return ''
  }
}



// Helper function to get global rules
export async function getGlobalRules(): Promise<string> {
  if (!supabaseClient) {
    // Fallback to localStorage
    try {
      const localRules = localStorage.getItem('globalRules')
      return localRules || ''
    } catch {
      return ''
    }
  }
  
  try {
    const { data, error } = await supabaseClient
      .from('user_contexts')
      .select('content')
      .like('content', 'GLOBAL_RULES:%')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      // Fallback to localStorage
      try {
        const localRules = localStorage.getItem('globalRules')
        return localRules || ''
      } catch {
        return ''
      }
    }
    
    return data.content.replace('GLOBAL_RULES:', '')
  } catch (error) {
    console.error('Error fetching global rules:', error)
    // Fallback to localStorage
    try {
      const localRules = localStorage.getItem('globalRules')
      return localRules || ''
    } catch {
      return ''
    }
  }
}