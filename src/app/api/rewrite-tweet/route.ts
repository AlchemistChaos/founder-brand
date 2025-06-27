import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { RewriteRequest, RewriteResponse } from '@/lib/types';
import { getToneExamples, getUserContexts, getGlobalRules } from '@/lib/supabase-client';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const rewriteOptions = {
  grammar: {
    instruction: "Fix grammar and spelling errors while maintaining the original meaning and tone",
    temperature: 0.3
  },
  improve: {
    instruction: "Improve clarity, flow, and engagement while keeping the same meaning",
    temperature: 0.5
  },
  punchy: {
    instruction: "Make more punchy, impactful, and attention-grabbing",
    temperature: 0.7
  },
  condense: {
    instruction: "Make more concise while preserving key information and impact",
    temperature: 0.4
  },
  rephrase: {
    instruction: "Rephrase completely while maintaining the same meaning and intent",
    temperature: 0.8
  }
};

export async function POST(request: NextRequest) {
  try {
    const body: RewriteRequest = await request.json();
    const { selectedText, fullTweet, rewriteType, customPrompt, threadContext, personalContext, globalRules } = body;
    
    if (!selectedText || !fullTweet || !rewriteType) {
      return NextResponse.json(
        { error: 'Missing required fields: selectedText, fullTweet, rewriteType' },
        { status: 400 }
      );
    }

    if (!rewriteOptions[rewriteType] && !customPrompt) {
      return NextResponse.json(
        { error: 'Invalid rewrite type' },
        { status: 400 }
      );
    }

    // Fetch tone examples for style matching
    const [userContexts, userGlobalRules, toneExamples] = await Promise.all([
      personalContext ? getUserContexts() : Promise.resolve(''),
      globalRules ? getGlobalRules() : Promise.resolve(''),
      getToneExamples()
    ]);

    const rewrittenText = await rewriteText({
      selectedText,
      fullTweet,
      rewriteType,
      customPrompt,
      threadContext,
      personalContext: userContexts,
      globalRules: userGlobalRules,
      toneExamples
    });

    const response: RewriteResponse = {
      rewrittenText,
      originalText: selectedText
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Rewrite error:', error);
    return NextResponse.json(
      { error: 'Failed to rewrite text. Please try again.' },
      { status: 500 }
    );
  }
}

async function rewriteText({
  selectedText,
  fullTweet,
  rewriteType,
  customPrompt,
  threadContext,
  personalContext,
  globalRules,
  toneExamples
}: {
  selectedText: string;
  fullTweet: string;
  rewriteType: string;
  customPrompt?: string;
  threadContext?: string[];
  personalContext?: string;
  globalRules?: string;
  toneExamples?: string;
}): Promise<string> {
  const contextText = threadContext && threadContext.length > 0
    ? `\n\nThread Context:\n${threadContext.join('\n')}`
    : '';

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

  const option = rewriteOptions[rewriteType as keyof typeof rewriteOptions];
  const instruction = customPrompt || option?.instruction || 'Rewrite the text';

  const prompt = `You are an expert copywriter. Your task is to rewrite ONLY the selected portion of text according to the given instructions.

Full Tweet:
"${fullTweet}"

Selected Text to Rewrite:
"${selectedText}"

Rewrite Instructions:
${instruction}${contextText}${personalContextText}${globalRulesText}${toneExamplesText}

CRITICAL REQUIREMENTS:
- Rewrite ONLY the selected text portion, not the entire tweet
- The rewritten text must fit naturally within the full tweet context
- Preserve the original tone and voice
${toneExamples ? '- MATCH THE EXACT TONE AND STYLE from the provided examples above' : ''}
- Keep character count reasonable for Twitter (aim to maintain similar length)
- Make sure the result flows naturally with the rest of the tweet

TONE AND STYLE REQUIREMENTS:
${toneExamples ? '- Write in the same voice, style, and personality as shown in the examples' : '- Maintain the original style and voice'}
- Use similar sentence structure, vocabulary, and writing patterns
- Maintain the same level of formality/informality as the examples
- If examples are casual, be casual. If examples are professional, be professional.

IMPORTANT: Return ONLY the rewritten selected text, no quotes, no explanations, no additional formatting.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: option?.temperature || 0.6,
      max_tokens: 150,
    });

    const result = completion.choices[0]?.message?.content?.trim() || selectedText;
    
    // Simple validation to ensure we got a reasonable result
    if (result.length === 0 || result.length > selectedText.length * 3) {
      console.warn('Rewrite result seems invalid, returning original');
      return selectedText;
    }

    return result;

  } catch (error) {
    console.error('Error in OpenAI rewrite:', error);
    throw error;
  }
} 