import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { content, threadType, usePersonalContext } = await request.json()
    
    if (!content || !content.trim()) {
      return Response.json({ error: 'Content is required' }, { status: 400 })
    }

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ 
        error: 'OpenAI API key is not configured. Please add OPENAI_API_KEY to your environment variables.' 
      }, { status: 500 })
    }

    // For now, let's try a direct OpenAI call without the complex extractors
    try {
      const { default: OpenAI } = await import('openai')
      
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })

      // Simple thread generation
      const threadResponse = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert Twitter thread creator. Create an engaging 8-12 tweet thread from the provided content. Each tweet should be under 280 characters. Start with an engaging hook and end with a call-to-action. Number each tweet (1/X, 2/X, etc.).`
          },
          {
            role: 'user',
            content: `Create a ${threadType} style Twitter thread from this content:\n\n${content}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      })

      // Simple art prompt generation
      const artResponse = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Create 2-3 Midjourney-style AI art prompts based on the content. Use the format: /imagine prompt: [description] --ar 16:9 --style raw --v 6`
          },
          {
            role: 'user',
            content: content
          }
        ],
        temperature: 0.8,
        max_tokens: 500,
      })

      const threadText = threadResponse.choices[0]?.message?.content || ''
      const artText = artResponse.choices[0]?.message?.content || ''

      // Parse thread
      const thread = threadText
        .split(/\d+\/\d+\s+/)
        .map(tweet => tweet.trim())
        .filter(tweet => tweet.length > 0)
        .map((tweet, index, array) => {
          if (!tweet.match(/^\d+\/\d+/)) {
            return `${index + 1}/${array.length} ${tweet}`
          }
          return tweet
        })

      // Parse art prompts
      const artPrompts = artText
        .split('/imagine prompt:')
        .map(prompt => prompt.trim())
        .filter(prompt => prompt.length > 0)
        .map(prompt => `/imagine prompt: ${prompt}`)

      return Response.json({
        thread: thread.length > 0 ? thread : ['1/1 Here is your generated content! 🧵'],
        artPrompts: artPrompts.length > 0 ? artPrompts : [
          '/imagine prompt: abstract digital art representing the main concepts --ar 16:9 --style raw --v 6'
        ],
        extractedContent: {
          type: 'text',
          title: 'Generated Content',
        }
      })

    } catch (openaiError) {
      console.error('OpenAI error:', openaiError)
      return Response.json({ 
        error: `OpenAI API error: ${openaiError instanceof Error ? openaiError.message : 'Unknown error'}` 
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Generation API error:', error)
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred during generation'
    
    return Response.json({ error: errorMessage }, { status: 500 })
  }
}