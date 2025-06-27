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
  const { content, selectedHookIds, selectedHooks, personalContext, globalRules, customPromptId } = request

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

    for (const hookId of selectedHookIds) {
      try {
        // Find the corresponding hook data
        const hookData = selectedHooks?.find(h => h.id === hookId)
        
        if (!hookData) {
          console.error(`Hook data not found for ID: ${hookId}`)
          continue
        }

        // Generate thread from hook
        const thread = await generateThreadFromHook({
          content,
          hookData,
          personalContext,
          globalRules,
          customPromptId
        })
        
        threads.push(thread)
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
      selectedHooks: selectedHooks || []
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
  hookData,
  personalContext,
  globalRules,
  customPromptId
}: {
  content: string
  hookData: { id: string; text: string; templateTitle?: string; type: string }
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

  // Include the hook as the first tweet
  const tweetsWithHook = [hookData.text, ...thread]

  return {
    id: `thread-${hookData.id}-${Date.now()}`,
    hookId: hookData.id,
    tweets: tweetsWithHook,
    templateId: hookData.id.includes('template') ? hookData.id.split('-')[1] : undefined,
    templateTitle: hookData.templateTitle || (hookData.type === 'template' ? 'Template Thread' : 'Custom Thread')
  }
}