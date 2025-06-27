import { NextRequest } from 'next/server'
import { generateThreadEnhanced, generateArtPrompts } from '@/lib/ai/generator'
import { extractContent } from '@/lib/extractors'
import { GenerateThreadsRequest, GenerateThreadsResponse } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Check if this is the new hook-based request format
    if (body.selectedHookIds) {
      return handleHookBasedGeneration(body as GenerateThreadsRequest)
    }
    
    // Handle legacy request format
    const { content, threadType, usePersonalContext, customPromptId, useEnhancedHooks } = body
    
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
      // Check if content needs extraction or is already processed text
      let extractedContent
      
      // If content looks like a URL, try to extract it
      const isUrl = content.trim().match(/^https?:\/\//) || content.trim().includes('youtube.com') || content.trim().includes('youtu.be')
      
      if (isUrl && content.length < 500) {
        // Looks like a URL, try to extract
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
      } else {
        // Content is already processed text (transcript, article text, etc.)
        extractedContent = {
          type: 'text' as const,
          content: content,
          title: 'Processed Content'
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

// Handle new hook-based thread generation
async function handleHookBasedGeneration(request: GenerateThreadsRequest) {
  const { content, selectedHookIds, personalContext, globalRules, customPromptId } = request

  // Validate input
  if (!content || content.trim().length < 10) {
    return Response.json(
      { error: 'Content is required and must be at least 10 characters' },
      { status: 400 }
    )
  }

  if (!selectedHookIds || selectedHookIds.length !== 2) {
    return Response.json(
      { error: 'Exactly 2 hook IDs must be selected' },
      { status: 400 }
    )
  }

  // Check for OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ 
      error: 'OpenAI API key is not configured. Please add OPENAI_API_KEY to your environment variables.' 
    }, { status: 500 })
  }

  try {
    // Get hook data from the request or storage
    // For now, we'll need to reconstruct the hooks or store them temporarily
    // In a production app, you might want to store hooks in a cache/database
    
    const threads = []
    const selectedHooks = []

    for (const hookId of selectedHookIds) {
      try {
        // Generate thread from hook
        const thread = await generateThreadFromHook({
          content,
          hookId,
          personalContext,
          globalRules,
          customPromptId
        })
        
        threads.push(thread)
        
        // Mock hook data - in real implementation you'd retrieve the actual hook
        selectedHooks.push({
          id: hookId,
          text: `Hook ${hookId}`, // This would be the actual hook text
          type: hookId.includes('custom') ? 'custom' : 'template' as const,
          variation: 1 as 1 | 2
        })
      } catch (error) {
        console.error(`Failed to generate thread for hook ${hookId}:`, error)
        // Continue with other hooks even if one fails
      }
    }

    if (threads.length === 0) {
      return Response.json(
        { error: 'Failed to generate any threads from selected hooks' },
        { status: 500 }
      )
    }

    const response: GenerateThreadsResponse = {
      threads,
      selectedHooks
    }

    return Response.json(response)

  } catch (error) {
    console.error('Hook-based generation error:', error)
    return Response.json(
      { error: 'Failed to generate threads from hooks' },
      { status: 500 }
    )
  }
}

// Generate thread from a specific hook
async function generateThreadFromHook({
  content,
  hookId,
  personalContext,
  globalRules,
  customPromptId
}: {
  content: string
  hookId: string
  personalContext?: string
  globalRules?: string
  customPromptId?: string
}) {
  // Use the existing generateThreadEnhanced function but with hook-specific context
  const thread = await generateThreadEnhanced({
    content,
    threadType: 'summary', // Default type, could be inferred from hook
    usePersonalContext: !!personalContext,
    globalRules,
    customPromptId,
    useEnhancedHooks: false // We're using a specific hook, not random ones
  })

  return {
    id: `thread-${hookId}-${Date.now()}`,
    hookId,
    tweets: thread,
    templateId: hookId.includes('template') ? hookId.split('-')[1] : undefined,
    templateTitle: hookId.includes('template') ? 'Template Thread' : 'Custom Thread'
  }
}