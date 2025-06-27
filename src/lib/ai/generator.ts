import OpenAI from 'openai'
import { supabase } from '@/lib/supabase'
// Note: Hook generation is now handled by the new template system in /api/generate-hooks

// Check for OpenAI API key
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const THREAD_TYPE_PROMPTS = {
  summary: "Create a concise summary thread that highlights the key points and main takeaways.",
  listicle: "Structure this as a numbered list thread, breaking down insights into digestible points.",
  'myth-busting': "Create a myth-busting thread that challenges common misconceptions and provides clarity.",
  inspirational: "Transform this into an inspirational thread that motivates and empowers readers.",
  narrative: "Tell this as a compelling story with a clear beginning, middle, and end.",
  qa: "Structure this as a Q&A thread, addressing the most important questions readers would have.",
  controversial: "Present a thought-provoking, controversial opinion that challenges conventional thinking.",
  teardown: "Create an analytical deep-dive that breaks down complex concepts step by step.",
  idea: "Focus on creative ideas, innovative concepts, and actionable insights.",
  curated: "Curate the best insights and present them in a well-organized, valuable compilation.",
}

// Enhanced generation options
interface GenerationOptions {
  content: string
  threadType: string
  usePersonalContext?: boolean
  globalRules?: string
  customPromptId?: string
  useEnhancedHooks?: boolean
}

// New enhanced function with options
export async function generateThreadEnhanced(options: GenerationOptions): Promise<string[]> {
  const { content, threadType, usePersonalContext = false, globalRules, customPromptId, useEnhancedHooks = true } = options
  
  try {
    let personalContext = ''
    let customPrompt = ''
    
    // Load personal context if requested
    if (usePersonalContext) {
      const { data: contexts } = await supabase
        .from('user_contexts')
        .select('content')
        .order('created_at', { ascending: false })
      
      if (contexts && contexts.length > 0) {
        personalContext = contexts.map(c => c.content).join('\n\n')
      }
    }
    
    // Load custom prompt if specified
    if (customPromptId) {
      const { data: prompt } = await supabase
        .from('custom_prompts')
        .select('system_prompt')
        .eq('id', customPromptId)
        .eq('is_active', true)
        .single()
      
      if (prompt) {
        customPrompt = prompt.system_prompt
      }
    }

    const threadPrompt = THREAD_TYPE_PROMPTS[threadType as keyof typeof THREAD_TYPE_PROMPTS] || THREAD_TYPE_PROMPTS.summary

    // Add global rules to system prompt if available
    const globalRulesText = globalRules ? `

CRITICAL GLOBAL RULES (MUST FOLLOW):
${globalRules}` : ''

    // Use custom prompt if available, otherwise use default
    const systemPrompt = customPrompt || `You are an expert Twitter thread creator. Your job is to transform content into engaging, viral Twitter threads.${globalRulesText}

THREAD REQUIREMENTS:
- Create 8-12 tweets maximum
- Each tweet must be under 280 characters
- Start with an engaging hook that captures attention
- Use emojis strategically (1-2 per tweet)
- Include line breaks for readability
- End with a call-to-action or thought-provoking question
- Number each tweet (1/12, 2/12, etc.)

STYLE GUIDELINES:
- Use conversational, engaging tone
- Include specific examples and data when available
- Break complex ideas into digestible pieces
- Use formatting (bullet points, line breaks) for clarity
- Make each tweet valuable on its own

HOOK SELECTION:
Choose the most relevant hook from the provided examples that best fits the content. Adapt and customize the hook to match the specific topic and tone.

THREAD TYPE: ${threadPrompt}

${personalContext ? `PERSONAL CONTEXT TO INCORPORATE:
${personalContext}

Use this personal context to make the thread more authentic and personalized.` : ''}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Transform the following content into a Twitter thread:\n\n${content}` }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    if (!response.choices || response.choices.length === 0) {
      throw new Error('No response received from OpenAI')
    }

    const threadText = response.choices[0].message.content || ''
    
    if (!threadText.trim()) {
      throw new Error('Empty response received from OpenAI')
    }
    
    // Split into individual tweets
    const tweets = threadText
      .split(/\d+\/\d+\s+/)
      .map(tweet => tweet.trim())
      .filter(tweet => tweet.length > 0)
      .map((tweet, index, array) => {
        // Add tweet numbering if not present
        if (!tweet.match(/^\d+\/\d+/)) {
          return `${index + 1}/${array.length} ${tweet}`
        }
        return tweet
      })

    return tweets
  } catch (error) {
    console.error('Enhanced thread generation failed:', error)
    throw new Error('Failed to generate Twitter thread')
  }
}

// Backwards compatible function
export async function generateThread(
  content: string,
  threadType: string,
  usePersonalContext: boolean = false
): Promise<string[]> {
  return generateThreadEnhanced({
    content,
    threadType,
    usePersonalContext,
    useEnhancedHooks: true
  })
}

export async function generateArtPrompts(content: string): Promise<string[]> {
  try {
    const systemPrompt = `You are an expert at creating Midjourney-style AI art prompts. Transform the given content into 2-3 creative, visually striking art prompts.

PROMPT REQUIREMENTS:
- Use Midjourney v6 format: /imagine prompt: [description] --ar 16:9 --style raw --v 6
- Focus on visual metaphors and symbolic representations
- Include specific artistic styles, lighting, and composition details
- Make each prompt distinct and creative
- Draw inspiration from the themes, emotions, and concepts in the content

STYLE EXAMPLES:
- "futuristic cyberpunk cityscape with neon lights"
- "minimalist abstract representation of growth"
- "photorealistic portrait with dramatic lighting"
- "surreal landscape with floating elements"

Create prompts that would make compelling visual content to accompany the thread.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: content }
      ],
      temperature: 0.8,
      max_tokens: 800,
    })

    if (!response.choices || response.choices.length === 0) {
      throw new Error('No response received from OpenAI for art prompts')
    }

    const promptsText = response.choices[0].message.content || ''
    
    // Extract individual prompts
    const prompts = promptsText
      .split('/imagine prompt:')
      .map(prompt => prompt.trim())
      .filter(prompt => prompt.length > 0)
      .map(prompt => `/imagine prompt: ${prompt}`)

    return prompts.length > 0 ? prompts : [
      '/imagine prompt: abstract digital art representing innovation and creativity --ar 16:9 --style raw --v 6',
      '/imagine prompt: minimalist geometric composition with vibrant colors --ar 16:9 --style raw --v 6'
    ]
  } catch (error) {
    console.error('Art prompt generation failed:', error)
    throw new Error('Failed to generate AI art prompts')
  }
}

// Custom prompt management functions
export async function getCustomPrompts() {
  try {
    const { data, error } = await supabase
      .from('custom_prompts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Failed to get custom prompts:', error)
    return []
  }
}

export async function createCustomPrompt(name: string, description: string, systemPrompt: string) {
  try {
    const { data, error } = await supabase
      .from('custom_prompts')
      .insert([{ name, description, system_prompt: systemPrompt }])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Failed to create custom prompt:', error)
    throw new Error('Failed to create custom prompt')
  }
}

export async function updateCustomPrompt(id: string, updates: { name?: string; description?: string; system_prompt?: string; is_active?: boolean }) {
  try {
    const { data, error } = await supabase
      .from('custom_prompts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Failed to update custom prompt:', error)
    throw new Error('Failed to update custom prompt')
  }
}

export async function deleteCustomPrompt(id: string) {
  try {
    const { error } = await supabase
      .from('custom_prompts')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Failed to delete custom prompt:', error)
    throw new Error('Failed to delete custom prompt')
  }
}