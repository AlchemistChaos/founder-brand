import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  return Response.json({ 
    message: 'API is working',
    env: {
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasSupabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    return Response.json({ 
      message: 'POST request received',
      body,
      env: {
        hasOpenAI: !!process.env.OPENAI_API_KEY,
        hasSupabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL
      }
    })
  } catch (error) {
    return Response.json({ 
      error: 'Failed to parse JSON',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 400 })
  }
}