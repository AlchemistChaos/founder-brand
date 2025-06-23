import OpenAI from 'openai'
import { supabase } from '@/lib/supabase'

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

const HOOK_EXAMPLES = [
  "Here's the truth no one's telling you about",
  "I've been studying [topic] for [time] and discovered",
  "Everyone thinks [common belief], but here's what actually happens:",
  "The [industry/field] doesn't want you to know this:",
  "After [experience/research], I learned something shocking:",
  "Most people get [topic] completely wrong. Here's why:",
  "This changed everything I thought I knew about",
  "The data reveals something surprising about",
  "I used to believe [common belief] until I discovered",
  "If you only learn one thing about [topic], make it this:",
]

export async function generateThread(
  content: string,
  threadType: string,
  usePersonalContext: boolean = false
): Promise<string[]> {
  try {
    let personalContext = ''
    
    if (usePersonalContext) {
      const { data: contexts } = await supabase
        .from('user_contexts')
        .select('content')
        .order('created_at', { ascending: false })
      
      if (contexts && contexts.length > 0) {
        personalContext = contexts.map(c => c.content).join('\n\n')
      }
    }

    const threadPrompt = THREAD_TYPE_PROMPTS[threadType as keyof typeof THREAD_TYPE_PROMPTS] || THREAD_TYPE_PROMPTS.summary

    const systemPrompt = `You are an expert Twitter thread creator. Your job is to transform content into engaging, viral Twitter threads.

THREAD REQUIREMENTS:
- Create 8-12 tweets maximum
- Each tweet must be under 280 characters
- Start with an engaging hook from these examples: ${HOOK_EXAMPLES.join('; ')}
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

THREAD TYPE: ${threadPrompt}

${personalContext ? `PERSONAL CONTEXT TO INCORPORATE:
${personalContext}

Use this personal context to make the thread more authentic and personalized.` : ''}

Transform the following content into a Twitter thread:`

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: content }
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
    console.error('Thread generation failed:', error)
    throw new Error('Failed to generate Twitter thread')
  }
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