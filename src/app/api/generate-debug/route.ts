import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUG: API Route Called ===')
    
    const body = await request.json()
    console.log('=== DEBUG: Request Body ===', body)
    
    const { content, threadType, usePersonalContext } = body
    
    if (!content || !content.trim()) {
      console.log('=== DEBUG: Content is empty ===')
      return Response.json({ error: 'Content is required' }, { status: 400 })
    }

    console.log('=== DEBUG: Content Type Detection ===')
    console.log('Content length:', content.length)
    console.log('Content preview:', content.substring(0, 100))
    
    // Simple mock response for testing
    const mockThread = [
      "1/3 Here's a test thread based on your content! 🧵",
      "2/3 This is just a mock response to test the API integration.",
      "3/3 The actual OpenAI integration will replace this mock data."
    ]
    
    const mockArtPrompts = [
      "/imagine prompt: abstract digital art representing the main concepts --ar 16:9 --style raw --v 6",
      "/imagine prompt: minimalist illustration of key themes --ar 16:9 --style raw --v 6"
    ]

    console.log('=== DEBUG: Returning Mock Response ===')
    
    return Response.json({
      thread: mockThread,
      artPrompts: mockArtPrompts,
      extractedContent: {
        type: 'text',
        title: 'Debug Content',
      },
      debug: {
        contentLength: content.length,
        threadType,
        usePersonalContext,
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('=== DEBUG: API Error ===', error)
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred during generation'
    
    return Response.json({ 
      error: errorMessage,
      debug: {
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      }
    }, { status: 500 })
  }
}