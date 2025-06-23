import { NextRequest } from 'next/server'
import { generateThreadEnhanced, generateArtPrompts } from '@/lib/ai/generator'
import { extractContent } from '@/lib/extractors'

export async function POST(request: NextRequest) {
  try {
    const { content, threadType, usePersonalContext, customPromptId, useEnhancedHooks } = await request.json()
    
    if (!content || !content.trim()) {
      return Response.json({ error: 'Content is required' }, { status: 400 })
    }

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ 
        error: 'OpenAI API key is not configured. Please add OPENAI_API_KEY to your environment variables.' 
      }, { status: 500 })
    }

    try {
      // Extract content based on type (handles URLs, PDFs, etc.)
      let extractedContent
      try {
        extractedContent = await extractContent(content)
      } catch (extractionError) {
        // If extraction fails, treat as raw text
        console.warn('Content extraction failed, using as raw text:', extractionError)
        extractedContent = {
          type: 'text' as const,
          content: content,
          title: 'Raw Text Content'
        }
      }

      // Generate thread using enhanced generator with 100 hooks
      const thread = await generateThreadEnhanced({
        content: extractedContent.content,
        threadType,
        usePersonalContext,
        customPromptId,
        useEnhancedHooks: useEnhancedHooks !== false // Default to true
      })

      // Generate art prompts
      const artPrompts = await generateArtPrompts(extractedContent.content)

      return Response.json({
        thread,
        artPrompts,
        extractedContent: {
          type: extractedContent.type,
          title: extractedContent.title,
        },
        enhancedFeatures: {
          hooksUsed: useEnhancedHooks !== false,
          customPromptUsed: !!customPromptId,
          personalContextUsed: !!usePersonalContext
        }
      })

    } catch (generationError) {
      console.error('Generation error:', generationError)
      return Response.json({ 
        error: `Generation failed: ${generationError instanceof Error ? generationError.message : 'Unknown error'}` 
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('API error:', error)
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred during generation'
    
    return Response.json({ error: errorMessage }, { status: 500 })
  }
}