import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface RewriteRequest {
  selectedText: string;
  fullTweet: string;
  rewriteType: 'grammar' | 'improve' | 'punchy' | 'condense' | 'rephrase';
  customPrompt?: string; // Custom instruction for rewriting
  threadContext?: string[]; // Other tweets in the thread for context
  personalContext?: string;
  globalRules?: string;
}

export interface RewriteResponse {
  rewrittenText: string;
  originalText: string;
}

const REWRITE_PROMPTS = {
  grammar: {
    instruction: "Fix grammar and spelling errors while maintaining the original meaning and tone",
    temperature: 0.3
  },
  improve: {
    instruction: "Improve the writing quality, clarity, and flow while maintaining the original message",
    temperature: 0.5
  },
  punchy: {
    instruction: "Make the text more punchy, engaging, and impactful while keeping the core message",
    temperature: 0.7
  },
  condense: {
    instruction: "Condense the text to be more concise while preserving all key information",
    temperature: 0.4
  },
  rephrase: {
    instruction: "Rephrase the text with a fresh perspective while maintaining the same meaning",
    temperature: 0.8
  }
};

export async function POST(request: NextRequest) {
  try {
    const body: RewriteRequest = await request.json();
    const { selectedText, fullTweet, rewriteType, customPrompt, threadContext, personalContext, globalRules } = body;

    // Validate input
    if (!selectedText || !selectedText.trim()) {
      return NextResponse.json(
        { error: 'Selected text is required' },
        { status: 400 }
      );
    }

    if (!fullTweet || !fullTweet.trim()) {
      return NextResponse.json(
        { error: 'Full tweet context is required' },
        { status: 400 }
      );
    }

    if (!customPrompt && !REWRITE_PROMPTS[rewriteType]) {
      return NextResponse.json(
        { error: 'Invalid rewrite type' },
        { status: 400 }
      );
    }

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    // Use custom prompt or default rewrite config
    const rewriteConfig = customPrompt 
      ? { instruction: customPrompt, temperature: 0.7 }
      : REWRITE_PROMPTS[rewriteType];
    
    // Build context for the rewrite
    const threadContextText = threadContext && threadContext.length > 0
      ? `\n\nThread Context (other tweets):\n${threadContext.join('\n')}`
      : '';

    const personalContextText = personalContext
      ? `\n\nPersonal Context: ${personalContext}`
      : '';

    const globalRulesText = globalRules
      ? `\n\nIMPORTANT GLOBAL RULES: ${globalRules}`
      : '';

    const systemPrompt = `You are an expert Twitter content editor. Your task is to ${rewriteConfig.instruction}.

CRITICAL REQUIREMENTS:
- Only rewrite the selected portion of text
- Maintain consistency with the rest of the tweet
- Keep the rewritten text roughly the same length unless condensing
- Preserve the original tone and voice
- Ensure the rewritten portion flows naturally with surrounding text
- For Twitter: stay under 280 characters for the full tweet
- Use emojis sparingly and only if they were in the original or improve engagement${personalContextText}${globalRulesText}

Return ONLY the rewritten portion of text, nothing else.`;

    const userPrompt = `Full Tweet Context:
"${fullTweet}"

Selected Text to Rewrite:
"${selectedText}"

Task: ${rewriteConfig.instruction}${threadContextText}

Rewrite only the selected portion:`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: rewriteConfig.temperature,
      max_tokens: 200,
    });

    const rewrittenText = response.choices[0].message.content?.trim();

    if (!rewrittenText) {
      return NextResponse.json(
        { error: 'No rewrite generated' },
        { status: 500 }
      );
    }

    // Remove quotes if the AI added them
    const cleanedRewrite = rewrittenText.replace(/^["']|["']$/g, '');

    const result: RewriteResponse = {
      rewrittenText: cleanedRewrite,
      originalText: selectedText
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Tweet rewrite error:', error);
    return NextResponse.json(
      { error: 'Failed to rewrite tweet portion' },
      { status: 500 }
    );
  }
} 