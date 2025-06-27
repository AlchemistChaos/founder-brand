import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { TwitterThread, Hook } from '@/lib/types'
import { getToneExamples, getUserContexts, getGlobalRules } from '@/lib/supabase-client'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { hooks, content, usePersonalContext, customPromptId } = await request.json()

    if (!hooks || !Array.isArray(hooks) || hooks.length === 0) {
      return NextResponse.json({ error: 'Hooks are required' }, { status: 400 })
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Fetch user data including tone examples
    const [personalContext, globalRules, toneExamples, customPrompt] = await Promise.all([
      usePersonalContext ? getUserContexts() : Promise.resolve(''),
      getGlobalRules(),
      getToneExamples(),
      customPromptId ? getCustomPrompt(customPromptId) : Promise.resolve(null)
    ]);

    const threads: TwitterThread[] = []

    for (const hook of hooks) {
      try {
        const thread = await generateThread({
          hook,
          content,
          personalContext,
          globalRules,
          toneExamples,
          customPrompt
        })
        threads.push(thread)
      } catch (error) {
        console.error(`Failed to generate thread for hook ${hook.id}:`, error)
        // Continue with other threads
      }
    }

    if (threads.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate any threads' },
        { status: 500 }
      )
    }

    return NextResponse.json({ threads })

  } catch (error) {
    console.error('Thread generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate threads. Please try again.' },
      { status: 500 }
    )
  }
}

async function generateThread({
  hook,
  content,
  personalContext,
  globalRules,
  toneExamples,
  customPrompt
}: {
  hook: Hook
  content: string
  personalContext?: string
  globalRules?: string
  toneExamples?: string
  customPrompt?: any
}): Promise<TwitterThread> {
  const personalContextText = personalContext 
    ? `\n\nPersonal Context: ${personalContext}`
    : '';

  const globalRulesText = globalRules 
    ? `\n\nIMPORTANT GLOBAL RULES (MUST FOLLOW): ${globalRules}`
    : '';

  const toneExamplesText = toneExamples
    ? `\n\nYOUR WRITING STYLE EXAMPLES (Match this tone and style exactly):
${toneExamples}`
    : '';

  const customPromptText = customPrompt?.system_prompt
    ? `\n\nCustom Style Instructions: ${customPrompt.system_prompt}`
    : '';

  const prompt = `You are an expert Twitter thread writer. Create a complete Twitter thread based on this hook and content.

Hook (Opening Tweet):
${hook.text}

Source Content:
${content}${personalContextText}${globalRulesText}${toneExamplesText}${customPromptText}

CRITICAL REQUIREMENTS:
- Create a cohesive thread that flows naturally from the hook
- Each tweet must be 140-279 characters (aim for 200-260 for optimal engagement)
- Generate 3-8 tweets total (including the hook as tweet 1)
- Number each tweet with (1/X), (2/X), etc. format
- Make each tweet valuable and engaging on its own

TONE AND STYLE REQUIREMENTS:
${toneExamples ? '- MATCH THE EXACT TONE AND STYLE from the provided examples above' : '- Use an engaging, conversational tone that matches the content'}
- Write in the same voice, style, and personality as shown in the examples
- Use similar sentence structure, vocabulary, and writing patterns  
- Maintain the same level of formality/informality as the examples
- If examples are casual, be casual. If examples are professional, be professional.
- Keep consistent voice throughout the entire thread

CONTENT STRUCTURE:
- Tweet 1: Use the provided hook exactly as given
- Tweet 2-3: Expand on the hook with key insights/points
- Middle tweets: Provide details, examples, or supporting evidence
- Final tweet: Strong conclusion, call-to-action, or key takeaway

Format your response as a JSON array of tweets:
[
  {"text": "Tweet 1 text here", "number": 1},
  {"text": "Tweet 2 text here", "number": 2},
  ...
]

IMPORTANT: Return ONLY the JSON array, no additional text or formatting.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1500,
    })

    const responseText = completion.choices[0]?.message?.content?.trim() || ''
    
    // Parse the JSON response
    let tweets: Array<{text: string, number: number}>
    try {
      tweets = JSON.parse(responseText)
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError)
      throw new Error('Invalid response format from AI')
    }

    // Validate and clean up tweets
    const validTweets = tweets
      .filter(tweet => tweet.text && tweet.text.trim().length > 0)
      .map((tweet, index) => ({
        ...tweet,
        number: index + 1,
        text: tweet.text.length > 279 
          ? tweet.text.substring(0, 276) + '...' 
          : tweet.text
      }))

    if (validTweets.length === 0) {
      throw new Error('No valid tweets generated')
    }

    // Ensure the first tweet matches the hook
    validTweets[0].text = hook.text

         return {
       id: `thread-${hook.id}`,
       hookId: hook.id,
       tweets: validTweets.map(tweet => tweet.text),
       templateId: hook.templateId,
       templateTitle: hook.templateTitle
     }

  } catch (error) {
    console.error('Error generating thread:', error)
    throw error
  }
}

async function getCustomPrompt(promptId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/custom-prompts`)
    if (!response.ok) return null
    
    const data = await response.json()
    return data.prompts?.find((p: any) => p.id === promptId) || null
  } catch (error) {
    console.error('Error fetching custom prompt:', error)
    return null
  }
}