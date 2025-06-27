import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GenerateHooksRequest, GenerateHooksResponse, Hook, ContentAnalysis, TemplateMatch } from '@/lib/types';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Load templates from JSON file
function loadTemplates() {
  const templatesPath = path.join(process.cwd(), 'templates.json');
  const templatesData = fs.readFileSync(templatesPath, 'utf8');
  return JSON.parse(templatesData);
}

// Content analysis function
function analyzeContent(content: string): ContentAnalysis {
  const hasPersonalStory = /\b(I|my|me|myself)\b/gi.test(content);
  const hasStatistics = /\b\d+%|\b\d+\s+(percent|times|years|months|days)\b/gi.test(content);
  const hasQuotes = /"[^"]*"/g.test(content);
  const hasNamedPeople = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/.test(content);
  const hasFrameworks = /\b(framework|method|system|process|steps?|approach)\b/i.test(content);
  const hasBookReferences = /\b(book|author|read|chapter)\b/i.test(content);

  // Extract main topics
  const topics = [];
  if (/\b(business|startup|entrepreneur|company)\b/gi.test(content)) topics.push('business');
  if (/\b(learn|education|study|skill|knowledge)\b/gi.test(content)) topics.push('learning');
  if (/\b(success|achieve|goal|win|accomplish)\b/gi.test(content)) topics.push('success');
  if (/\b(life|personal|experience|story)\b/gi.test(content)) topics.push('personal');
  if (/\b(mistake|fail|error|wrong)\b/gi.test(content)) topics.push('mistakes');
  if (/\b(advice|tip|help|guide|how)\b/gi.test(content)) topics.push('advice');

  // Determine tone
  const positiveWords = /\b(success|great|amazing|wonderful|excellent|best|love|fantastic|awesome|perfect)\b/gi;
  const negativeWords = /\b(fail|failure|mistake|wrong|bad|terrible|awful|hate|worst|problem)\b/gi;
  
  const positiveMatches = (content.match(positiveWords) || []).length;
  const negativeMatches = (content.match(negativeWords) || []).length;
  
  let tone: ContentAnalysis['tone'] = 'educational';
  if (hasPersonalStory) tone = 'personal';
  else if (positiveMatches > negativeMatches) tone = 'inspirational';
  else if (/\b(analysis|data|research|study)\b/i.test(content)) tone = 'analytical';
  else if (/\b(wrong|myth|misconception|controversial|unpopular)\b/i.test(content)) tone = 'controversial';

  return {
    hasPersonalStory,
    hasStatistics,
    hasQuotes,
    hasNamedPeople,
    hasFrameworks,
    hasBookReferences,
    mainTopics: topics,
    tone
  };
}

// Template matching function optimized for hook strength
function getTemplateMatches(content: string, limit: number = 10): TemplateMatch[] {
  const templates = loadTemplates();
  const analysis = analyzeContent(content);
  const matches: TemplateMatch[] = [];

  for (const template of templates) {
    let score = 0;
    const reasons: string[] = [];

    // HOOK STRENGTH SCORING - prioritize templates that create strong hooks
    
    // 1. High-engagement hook patterns (strong openers)
    const strongHookPatterns = [
      'I spent over', 'The most', 'Here are', 'Everyone thinks', 'Most people',
      'I asked', 'The secret', 'How to', 'Why', 'What most people don\'t know',
      'The biggest mistake', 'I used to think', 'Unpopular opinion', 'Controversial'
    ];
    
    for (const pattern of strongHookPatterns) {
      if (template.template.toLowerCase().includes(pattern.toLowerCase())) {
        score += 40;
        reasons.push(`Strong hook pattern: "${pattern}"`);
        break; // Only count once per template
      }
    }

    // 2. Curiosity-gap templates (create intrigue)
    const curiosityTriggers = [
      'secret', 'hidden', 'nobody tells you', 'what I learned', 'behind the scenes',
      'the real reason', 'what actually', 'truth about', 'what happens when'
    ];
    
    for (const trigger of curiosityTriggers) {
      if (template.template.toLowerCase().includes(trigger)) {
        score += 35;
        reasons.push('Creates curiosity gap');
        break;
      }
    }

    // 3. Social proof and authority (proven engagement drivers)
    const authorityPatterns = [
      'legendary', 'successful', 'expert', 'master', 'godfather', 'king', 'best',
      'highest-paid', 'most valuable', 'world\'s most', 'top', 'greatest'
    ];
    
    for (const pattern of authorityPatterns) {
      if (template.template.toLowerCase().includes(pattern)) {
        score += 30;
        reasons.push('Leverages authority/social proof');
        break;
      }
    }

    // 4. Numbered lists and frameworks (high engagement)
    if (/\[X\]|\[\d+\]/.test(template.template)) {
      score += 25;
      reasons.push('Numbered list format (high engagement)');
    }

    // 5. Personal transformation stories (highly relatable)
    const transformationWords = ['used to', 'now I', 'changed my', 'went from', 'transformation', 'journey'];
    for (const word of transformationWords) {
      if (template.template.toLowerCase().includes(word)) {
        score += 20;
        reasons.push('Personal transformation angle');
        break;
      }
    }

    // 6. Problem/solution dynamics (strong psychological hook)
    const problemSolutionWords = ['mistake', 'problem', 'struggle', 'failing', 'wrong', 'fix', 'solve'];
    for (const word of problemSolutionWords) {
      if (template.template.toLowerCase().includes(word)) {
        score += 15;
        reasons.push('Problem/solution dynamic');
        break;
      }
    }

    // CONTENT MATCHING (secondary to hook strength)
    
    // Content characteristics (lower weight than hook strength)
    if (analysis.hasPersonalStory && template.category === 'Personal Story') {
      score += 15;
      reasons.push('Matches personal story content');
    }
    
    if (analysis.hasStatistics && (template.category === 'Educational Breakdown' || template.category === 'Insight & Prediction')) {
      score += 12;
      reasons.push('Matches data-driven content');
    }
    
    if (analysis.hasNamedPeople && (template.category === 'Social Proof / Spotlight' || template.category === 'Curation')) {
      score += 15;
      reasons.push('Matches people-focused content');
    }
    
    if (analysis.hasBookReferences && template.category === 'Book-Based') {
      score += 20;
      reasons.push('Perfect for book content');
    }
    
    if (analysis.hasFrameworks && template.category === 'Educational Breakdown') {
      score += 15;
      reasons.push('Matches framework content');
    }

    // Topic relevance (smaller impact)
    for (const topic of analysis.mainTopics) {
      if (template.template.toLowerCase().includes(topic) || template.summary.toLowerCase().includes(topic)) {
        score += 8;
        reasons.push(`Topic relevance: ${topic}`);
      }
    }

    // Tone matching
    if (analysis.tone === 'controversial' && template.template.toLowerCase().includes('contrarian')) {
      score += 25;
      reasons.push('Matches controversial tone');
    }

    // Small randomness for variety (much smaller impact)
    score += Math.random() * 3;

    if (score > 0) {
      matches.push({
        template,
        score,
        reason: reasons.join(', ') || 'General content match'
      });
    }
  }

  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}



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

    // Step 1: Analyze content and get top 10 templates
    console.log('Analyzing content and scoring templates...');
    const contentAnalysis = analyzeContent(content);
    const templateMatches = getTemplateMatches(content, 10);

    if (templateMatches.length === 0) {
      return NextResponse.json(
        { error: 'No suitable templates found for this content' },
        { status: 400 }
      );
    }

    console.log(`Found ${templateMatches.length} template matches`);

    // Step 2: Generate hooks from top 8 templates (1 variation each = 8 hooks)
    const templateHooks: Hook[] = [];
    
    for (let i = 0; i < Math.min(8, templateMatches.length); i++) {
      const match = templateMatches[i];
      const template = match.template;
      
      try {
        const hook = await generateTemplateHook({
          content,
          template,
          personalContext,
          globalRules,
          variation: 1
        });
        
        templateHooks.push({
          id: `template-${template.id}`,
          text: hook,
          templateId: template.id,
          templateTitle: template.title,
          templateCategory: template.category,
          variation: 1,
          type: 'template',
          score: match.score
        });
      } catch (error) {
        console.error(`Failed to generate hook for template ${template.id}:`, error);
        // Continue with other templates even if one fails
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

// Generate hook from template with character optimization
async function generateTemplateHook({
  content,
  template,
  personalContext,
  globalRules,
  variation
}: {
  content: string;
  template: any;
  personalContext?: string;
  globalRules?: string;
  variation: 1;
}) {
  const personalContextText = personalContext 
    ? `\n\nPersonal Context: ${personalContext}`
    : '';

  const globalRulesText = globalRules 
    ? `\n\nIMPORTANT GLOBAL RULES (MUST FOLLOW): ${globalRules}`
    : '';

  let prompt = `You are an expert Twitter thread writer. Generate a compelling hook (opening tweet) based on this template and content.

Template: ${template.title}
Template Category: ${template.category}
Template Structure: ${template.template.split('\n').slice(0, 3).join('\n')}...

Content to base hook on:
${content}${personalContextText}${globalRulesText}

PLACEHOLDER INSTRUCTIONS:
- Replace [X] with relevant numbers from the content (e.g., if content mentions "154 students", use 154)
- Replace [Topic], [Skill], [Niche] with the main subject from the content
- Replace [TimePeriod] with relevant timeframes mentioned (e.g., "8 weeks", "6 months")
- If specific numbers/details aren't in content, use realistic, engaging alternatives
- Ignore publication dates and author bylines when extracting numbers

CRITICAL CHARACTER REQUIREMENTS:
- The hook must be between 140-279 characters (aim for 200-260 for optimal engagement)
- Count characters carefully including spaces and punctuation
- If the hook approaches 280 characters, make it more concise
- Never exceed 279 characters under any circumstances

The hook should:
- Be maximally engaging and attention-grabbing
- Follow the template's opening style and psychological triggers
- Use extracted data from the content where appropriate
- Be exactly 1 tweet (never multiple tweets)
- Include relevant emojis sparingly (max 2-3) if they enhance engagement
- Create curiosity, urgency, or strong emotional response
- Match the template category's proven engagement patterns

Generate only the hook text, no explanations. Optimize for maximum virality within the character limit:`;

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.7,
    });

    const hookText = response.choices[0]?.message?.content?.trim() || '';
    
    // Validate character length
    if (hookText.length >= 140 && hookText.length <= 279) {
      return hookText;
    }
    
    // If too long or too short, retry with adjustment
    attempts++;
    if (attempts < maxAttempts) {
      const adjustment = hookText.length > 279 
        ? `The previous hook was ${hookText.length} characters, which is too long. Make it more concise while keeping the impact.`
        : `The previous hook was ${hookText.length} characters, which is too short. Add more compelling details while staying under 279 characters.`;
      
      prompt += `\n\nADJUSTMENT NEEDED: ${adjustment}`;
    }
  }

  // If all attempts failed, return the last attempt (better than nothing)
  const fallbackResponse = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 100,
    temperature: 0.3,
  });

  return fallbackResponse.choices[0]?.message?.content?.trim() || '';
}

// Generate custom creative hook with character optimization
async function generateCustomHook({
  content,
  contentAnalysis,
  personalContext,
  globalRules,
  variation
}: {
  content: string;
  contentAnalysis: ContentAnalysis;
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
    ? "Create a bold, attention-grabbing hook with maximum viral potential."
    : "Create a more conversational, relatable hook that creates strong emotional connection.";

  let prompt = `You are an expert Twitter thread writer. Create a completely original, creative hook (opening tweet) for this content.

Content:
${content}${personalContextText}${globalRulesText}

Content Analysis:
- Tone: ${contentAnalysis.tone}
- Has personal story: ${contentAnalysis.hasPersonalStory}
- Has statistics: ${contentAnalysis.hasStatistics}
- Has quotes: ${contentAnalysis.hasQuotes}
- Main topics: ${contentAnalysis.mainTopics.join(', ')}

CRITICAL CHARACTER REQUIREMENTS:
- The hook must be between 140-279 characters (aim for 200-260 for optimal engagement)
- Count characters carefully including spaces and punctuation
- If the hook approaches 280 characters, make it more concise
- Never exceed 279 characters under any circumstances

Instructions:
${toneVariation}

The hook should:
- Be completely original and creative (avoid template patterns)
- Capture the essence of the content with maximum impact
- Use psychological triggers: curiosity, controversy, surprise, emotion
- Be exactly 1 tweet (never multiple tweets)
- Include relevant emojis sparingly (max 2-3) if they enhance engagement
- Stand out from typical template-based hooks
- Create an irresistible urge to read the full thread

Generate only the hook text, no explanations. Optimize for maximum virality within the character limit:`;

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: variation === 1 ? 0.8 : 1.0,
    });

    const hookText = response.choices[0]?.message?.content?.trim() || '';
    
    // Validate character length
    if (hookText.length >= 140 && hookText.length <= 279) {
      return hookText;
    }
    
    // If too long or too short, retry with adjustment
    attempts++;
    if (attempts < maxAttempts) {
      const adjustment = hookText.length > 279 
        ? `The previous hook was ${hookText.length} characters, which is too long. Make it more concise while keeping the viral impact.`
        : `The previous hook was ${hookText.length} characters, which is too short. Add more compelling details while staying under 279 characters.`;
      
      prompt += `\n\nADJUSTMENT NEEDED: ${adjustment}`;
    }
  }

  // If all attempts failed, return the last attempt
  const fallbackResponse = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 100,
    temperature: 0.5,
  });

  return fallbackResponse.choices[0]?.message?.content?.trim() || '';
}