import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getTemplateMatches, analyzeContent, extractPlaceholderData } from '@/lib/templates-simple';
import { GenerateHooksRequest, GenerateHooksResponse, Hook } from '@/lib/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const body: GenerateHooksRequest = await request.json();
    const { content, personalContext, globalRules } = body;

    // Validate input
    if (!content || content.trim().length < 10) {
      return NextResponse.json(
        { error: 'Content is required and must be at least 10 characters' },
        { status: 400 }
      );
    }

    if (content.length > 10000) {
      return NextResponse.json(
        { error: 'Content must be less than 10,000 characters' },
        { status: 400 }
      );
    }

    // Step 1: Analyze content and get top 5 templates
    console.log('Analyzing content and scoring templates...');
    const contentAnalysis = analyzeContent(content);
    const templateMatches = getTemplateMatches(content, 5);

    if (templateMatches.length === 0) {
      return NextResponse.json(
        { error: 'No suitable templates found for this content' },
        { status: 400 }
      );
    }

    console.log(`Found ${templateMatches.length} template matches`);

    // Step 2: Generate hooks from top 5 templates (2 variations each = 8 hooks)
    const templateHooks: Hook[] = [];
    
    for (let i = 0; i < Math.min(4, templateMatches.length); i++) {
      const match = templateMatches[i];
      const template = match.template;
      
      // Extract placeholder data for this template
      const placeholderData = extractPlaceholderData(content, template.template);
      
      // Generate 2 variations for this template
      for (let variation = 1; variation <= 2; variation++) {
        try {
          const hook = await generateTemplateHook({
            content,
            template,
            placeholderData,
            personalContext,
            globalRules,
            variation: variation as 1 | 2
          });
          
          templateHooks.push({
            id: `template-${template.id}-v${variation}`,
            text: hook,
            templateId: template.id,
            templateTitle: template.title,
            templateCategory: template.category,
            variation: variation as 1 | 2,
            type: 'template',
            score: match.score
          });
        } catch (error) {
          console.error(`Failed to generate hook for template ${template.id}, variation ${variation}:`, error);
          // Continue with other templates even if one fails
        }
      }
    }

    // Step 3: Generate 2 custom creative hooks
    const customHooks: Hook[] = [];
    
    for (let variation = 1; variation <= 2; variation++) {
      try {
        const hook = await generateCustomHook({
          content,
          contentAnalysis,
          personalContext,
          globalRules,
          variation: variation as 1 | 2
        });
        
        customHooks.push({
          id: `custom-v${variation}`,
          text: hook,
          variation: variation as 1 | 2,
          type: 'custom'
        });
      } catch (error) {
        console.error(`Failed to generate custom hook variation ${variation}:`, error);
      }
    }

    // Combine all hooks
    const allHooks = [...templateHooks, ...customHooks];

    if (allHooks.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate any hooks' },
        { status: 500 }
      );
    }

    // Ensure we have exactly 10 hooks (pad with additional if needed)
    while (allHooks.length < 10 && templateMatches.length > 0) {
      // Generate additional hooks from remaining templates if we're short
      const remainingTemplates = templateMatches.slice(4);
      if (remainingTemplates.length > 0) {
        const template = remainingTemplates[0];
        const placeholderData = extractPlaceholderData(content, template.template);
        
        try {
          const hook = await generateTemplateHook({
            content,
            template: template.template,
            placeholderData,
            personalContext,
            variation: 1
          });
          
          allHooks.push({
            id: `fallback-${template.template.id}`,
            text: hook,
            templateId: template.template.id,
            templateTitle: template.template.title,
            templateCategory: template.template.category,
            variation: 1,
            type: 'template',
            score: template.score
          });
        } catch (error) {
          console.error('Failed to generate fallback hook:', error);
          break;
        }
      }
    }

    const response: GenerateHooksResponse = {
      hooks: allHooks.slice(0, 10), // Ensure max 10 hooks
      topTemplates: templateMatches,
      contentAnalysis
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Hook generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate hooks' },
      { status: 500 }
    );
  }
}

// Generate hook from template
async function generateTemplateHook({
  content,
  template,
  placeholderData,
  personalContext,
  globalRules,
  variation
}: {
  content: string;
  template: any;
  placeholderData: Record<string, string>;
  personalContext?: string;
  globalRules?: string;
  variation: 1 | 2;
}) {
  const personalContextText = personalContext 
    ? `\n\nPersonal Context: ${personalContext}`
    : '';

  const globalRulesText = globalRules 
    ? `\n\nIMPORTANT GLOBAL RULES (MUST FOLLOW): ${globalRules}`
    : '';

  const variationPrompt = variation === 1 
    ? "Create a compelling hook that follows the template structure closely."
    : "Create an alternative hook with a slightly different angle or tone while still following the template.";

  const prompt = `You are an expert Twitter thread writer. Generate a compelling hook (opening tweet) based on this template and content.

Template: ${template.title}
Template Category: ${template.category}
Template Structure: ${template.template.split('\n').slice(0, 3).join('\n')}...

Content to base hook on:
${content}${personalContextText}${globalRulesText}

Available placeholders and extracted data:
${Object.entries(placeholderData).map(([key, value]) => `${key}: ${value}`).join('\n')}

Instructions:
${variationPrompt}

The hook should:
- Be engaging and attention-grabbing
- Follow the template's opening style
- Use extracted data from the content where appropriate
- Be 1-2 tweets maximum
- Include relevant emojis sparingly if they fit the tone
- Match the template category's typical voice

Generate only the hook text, no explanations:`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 200,
    temperature: variation === 1 ? 0.7 : 0.9, // More variation for second hook
  });

  return response.choices[0]?.message?.content?.trim() || '';
}

// Generate custom creative hook
async function generateCustomHook({
  content,
  contentAnalysis,
  personalContext,
  globalRules,
  variation
}: {
  content: string;
  contentAnalysis: any;
  personalContext?: string;
  globalRules?: string;
  variation: 1 | 2;
}) {
  const personalContextText = personalContext 
    ? `\n\nPersonal Context: ${personalContext}`
    : '';

  const globalRulesText = globalRules 
    ? `\n\nIMPORTANT GLOBAL RULES (MUST FOLLOW): ${globalRules}`
    : '';

  const toneVariation = variation === 1
    ? "Create a bold, attention-grabbing hook with a unique angle."
    : "Create a more conversational, relatable hook that draws readers in.";

  const prompt = `You are an expert Twitter thread writer. Create a completely original, creative hook (opening tweet) for this content.

Content:
${content}${personalContextText}${globalRulesText}

Content Analysis:
- Tone: ${contentAnalysis.tone}
- Has personal story: ${contentAnalysis.hasPersonalStory}
- Has statistics: ${contentAnalysis.hasStatistics}
- Has quotes: ${contentAnalysis.hasQuotes}
- Main topics: ${contentAnalysis.mainTopics.join(', ')}

Instructions:
${toneVariation}

The hook should:
- Be completely original and creative
- Capture the essence of the content in an engaging way
- Use your best judgment for style and approach
- Be 1-2 tweets maximum
- Include relevant emojis sparingly if they enhance the message
- Stand out from typical template-based hooks

Generate only the hook text, no explanations:`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 200,
    temperature: variation === 1 ? 0.8 : 1.0, // Higher creativity for custom hooks
  });

  return response.choices[0]?.message?.content?.trim() || '';
}