import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GenerateHooksRequest, GenerateHooksResponse, Hook, ContentAnalysis, TemplateMatch, PowerHook, PowerHookMatch } from '@/lib/types';
import fs from 'fs';
import path from 'path';
import { getToneExamples, getUserContexts, getGlobalRules, getPowerHooks } from '@/lib/supabase-client';

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

  // CATEGORY DIVERSIFICATION: Ensure variety across different hook types
  const categoryGroups: { [category: string]: TemplateMatch[] } = {};
  
  // Group matches by category
  matches.forEach(match => {
    const category = match.template.category;
    if (!categoryGroups[category]) {
      categoryGroups[category] = [];
    }
    categoryGroups[category].push(match);
  });
  
  // Sort each category group by score
  Object.keys(categoryGroups).forEach(category => {
    categoryGroups[category].sort((a, b) => b.score - a.score);
  });
  
  const diversifiedMatches: TemplateMatch[] = [];
  const maxPerCategory = 2; // Maximum 2 templates per category
  
  // First pass: Take the best template from each category
  const usedCategories = new Set<string>();
  Object.keys(categoryGroups).forEach(category => {
    if (diversifiedMatches.length < limit && categoryGroups[category].length > 0) {
      diversifiedMatches.push(categoryGroups[category][0]);
      usedCategories.add(category);
    }
  });
  
  // Second pass: Fill remaining slots with second-best from each category
  if (diversifiedMatches.length < limit) {
    Object.keys(categoryGroups).forEach(category => {
      if (diversifiedMatches.length < limit && categoryGroups[category].length > 1) {
        diversifiedMatches.push(categoryGroups[category][1]);
      }
    });
  }
  
  // Third pass: If still need more, take remaining highest-scoring across all categories
  if (diversifiedMatches.length < limit) {
    const remainingMatches = matches
      .filter(match => !diversifiedMatches.includes(match))
      .sort((a, b) => b.score - a.score);
    
    const slotsNeeded = limit - diversifiedMatches.length;
    diversifiedMatches.push(...remainingMatches.slice(0, slotsNeeded));
  }
  
  return diversifiedMatches.slice(0, limit);
}

// Power Hook matching and scoring function 
function getPowerHookMatches(content: string, analysis: ContentAnalysis, limit: number = 8): PowerHookMatch[] {
  const powerHooks = []; // Will be loaded dynamically in the POST handler
  const matches: PowerHookMatch[] = [];

  // This function will be called with loaded power hooks in the POST handler
  return matches;
}

// Power Hook matching implementation (called from POST handler with loaded data)
function scorePowerHooks(powerHooks: PowerHook[], content: string, analysis: ContentAnalysis, limit: number = 8): PowerHookMatch[] {
  const matches: PowerHookMatch[] = [];

  for (const powerHook of powerHooks) {
    let score = 0;
    let reason = '';
    const variableData: Record<string, string> = {};

    // CONTENT-BASED VARIABLE EXTRACTION
    // Extract variables from content for this power hook
    for (const variable of powerHook.variables) {
      switch (variable) {
        case 'topic':
          if (analysis.mainTopics.length > 0) {
            variableData[variable] = analysis.mainTopics[0];
            score += 15;
          } else {
            variableData[variable] = 'this';
            score += 5;
          }
          break;
        case 'industry':
          // Extract industry from content or default
          if (content.toLowerCase().includes('business')) variableData[variable] = 'business';
          else if (content.toLowerCase().includes('tech')) variableData[variable] = 'tech';
          else if (content.toLowerCase().includes('health')) variableData[variable] = 'health';
          else variableData[variable] = 'your field';
          score += 10;
          break;
        case 'field':
          variableData[variable] = variableData['industry'] || 'your field';
          score += 10;
          break;
        case 'X':
          // Extract a key term from content
          const keyTerms = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
          variableData[variable] = keyTerms[0] || 'this';
          score += 8;
          break;
        case 'journey':
          if (analysis.hasPersonalStory) {
            variableData[variable] = analysis.mainTopics[0] || 'this journey';
            score += 20;
          } else {
            variableData[variable] = 'this journey';
            score += 5;
          }
          break;
        default:
          variableData[variable] = 'this';
          score += 3;
      }
    }

    // POWER HOOK CATEGORY SCORING (high base scores for viral potential)
    const categoryScores = {
      'Myth Busting': 85,
      'Controversial': 90,
      'Hidden Value': 80,
      'Transformation': 75,
      'Authority/Secrets': 85,
      'Harsh Truth': 88,
      'Achievement Path': 70,
      'Elite Insights': 82,
      'Anti-Guru': 78
    };

    score += categoryScores[powerHook.category as keyof typeof categoryScores] || 60;

    // CONTENT MATCHING BONUSES
    if (analysis.hasPersonalStory && ['Transformation', 'Regret/Wisdom', 'Behavior Change', 'Limiting Belief'].includes(powerHook.category)) {
      score += 25;
      reason += 'Perfect for personal story content. ';
    }

    if (analysis.tone === 'controversial' && ['Myth Busting', 'Controversial', 'Harsh Truth'].includes(powerHook.category)) {
      score += 30;
      reason += 'Matches controversial tone. ';
    }

    if (analysis.hasStatistics && ['Elite Insights', 'Simple Success', 'Achievement Path'].includes(powerHook.category)) {
      score += 20;
      reason += 'Great for data-driven content. ';
    }

    // POWER HOOK TYPE BONUSES (psychological triggers)
    const typeScores = {
      'subversive': 25,      // "Everything you know is wrong"
      'confrontational': 30,  // "This will piss people off"
      'shocking': 28,        // "99% won't believe this"
      'revealing': 22,       // "Here's what nobody talks about"
      'transformative': 20   // "This will change how you think"
    };

    score += typeScores[powerHook.type as keyof typeof typeScores] || 15;

    // Add slight randomness for variety
    score += Math.random() * 5;

    if (score > 0) {
      matches.push({
        powerHook,
        score,
        reason: reason || `Viral potential: ${powerHook.category} hook`,
        variableData
      });
    }
  }

  // CATEGORY DIVERSIFICATION for power hooks
  const categoryGroups: { [category: string]: PowerHookMatch[] } = {};
  
  matches.forEach(match => {
    const category = match.powerHook.category;
    if (!categoryGroups[category]) {
      categoryGroups[category] = [];
    }
    categoryGroups[category].push(match);
  });
  
  // Sort each category by score
  Object.keys(categoryGroups).forEach(category => {
    categoryGroups[category].sort((a, b) => b.score - a.score);
  });
  
  const diversifiedMatches: PowerHookMatch[] = [];
  const maxPerCategory = 2; // Max 2 power hooks per category
  
  // First pass: Best from each category
  Object.keys(categoryGroups).forEach(category => {
    if (categoryGroups[category].length > 0 && diversifiedMatches.length < limit) {
      diversifiedMatches.push(categoryGroups[category][0]);
    }
  });
  
  // Second pass: Second best from each category (if space)
  if (diversifiedMatches.length < limit) {
    Object.keys(categoryGroups).forEach(category => {
      if (categoryGroups[category].length > 1 && diversifiedMatches.length < limit) {
        diversifiedMatches.push(categoryGroups[category][1]);
      }
    });
  }
  
  // Third pass: Fill remaining with highest scores
  if (diversifiedMatches.length < limit) {
    const remainingMatches = matches
      .filter(match => !diversifiedMatches.includes(match))
      .sort((a, b) => b.score - a.score);
    
    const slotsNeeded = limit - diversifiedMatches.length;
    diversifiedMatches.push(...remainingMatches.slice(0, slotsNeeded));
  }

  return diversifiedMatches.slice(0, limit);
}

export async function POST(request: NextRequest) {
  try {
    const { content, usePersonalContext } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Fetch user data AND power hooks
    const [personalContext, globalRules, toneExamples, powerHooks] = await Promise.all([
      usePersonalContext ? getUserContexts() : Promise.resolve(''),
      getGlobalRules(),
      getToneExamples(),
      getPowerHooks()
    ]);

    // Analyze content
    const contentAnalysis = analyzeContent(content);

    // Get power hook matches (8 power hooks) and template matches (for supporting structure)
    const powerHookMatches = scorePowerHooks(powerHooks, content, contentAnalysis, 8);
    const templateMatches = getTemplateMatches(content, 5); // Fewer templates, used for supporting structure

    const hooks: Hook[] = [];

    // Generate 8 POWER HOOK-based hooks (primary system)
    for (let i = 0; i < Math.min(8, powerHookMatches.length); i++) {
      const powerHookMatch = powerHookMatches[i];
      
      try {
        const hookText = await generatePowerHook({
          powerHookMatch,
          content,
          contentAnalysis,
          personalContext,
          globalRules,
          toneExamples,
          supportingTemplate: templateMatches[i % templateMatches.length]?.template, // Use templates for structure
          variation: 1
        });

        hooks.push({
          id: `power-hook-${i + 1}`,
          text: hookText,
          type: 'power-hook',
          variation: 1,
          powerHookId: powerHookMatch.powerHook.id,
          powerHookCategory: powerHookMatch.powerHook.category,
          score: powerHookMatch.score
        });
      } catch (error) {
        console.error(`Error generating power hook ${i + 1}:`, error);
        // Continue with other hooks
      }
    }

    // Generate 2 creative hooks (backup/variety)
    for (let i = 1; i <= 2; i++) {
      try {
        const hookText = await generateCustomHook({
          content,
          contentAnalysis,
          personalContext,
          globalRules,
          toneExamples,
          variation: i as 1 | 2
        });

        hooks.push({
          id: `custom-${i}`,
          text: hookText,
          type: 'custom',
          variation: i as 1 | 2
        });
      } catch (error) {
        console.error(`Error generating custom hook ${i}:`, error);
        // Continue with other hooks
      }
    }

    return NextResponse.json({
      hooks,
      topTemplates: templateMatches.slice(0, 5), // Supporting templates
      topPowerHooks: powerHookMatches.slice(0, 8), // Primary power hooks
      contentAnalysis
    });

  } catch (error) {
    console.error('Hook generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate hooks. Please try again.' },
      { status: 500 }
    );
  }
}

// Generate custom creative hook with character optimization
async function generateCustomHook({
  content,
  contentAnalysis,
  personalContext,
  globalRules,
  toneExamples,
  variation
}: {
  content: string;
  contentAnalysis: ContentAnalysis;
  personalContext?: string;
  globalRules?: string;
  toneExamples?: string;
  variation: 1 | 2;
}) {
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

  const toneVariation = variation === 1
    ? "Create a bold, attention-grabbing hook with maximum viral potential."
    : "Create a more conversational, relatable hook that creates strong emotional connection.";

  let prompt = `You are an expert Twitter thread writer. Create a completely original, creative hook (opening tweet) for this content.

Content:
${content}${personalContextText}${globalRulesText}${toneExamplesText}

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

TONE AND STYLE REQUIREMENTS:
${toneExamples ? '- MATCH THE EXACT TONE AND STYLE from the provided examples above' : '- Use an engaging, conversational tone that matches the content'}
- Write in the same voice, style, and personality as shown in the examples
- Use similar sentence structure, vocabulary, and writing patterns
- Maintain the same level of formality/informality as the examples
- If examples are casual, be casual. If examples are professional, be professional.

Instructions:
${toneVariation}

Think viral potential: What would make someone STOP scrolling and want to read more?

IMPORTANT: Return ONLY the hook text, no quotes, no explanations, no additional formatting.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 150,
    });

    const hookText = completion.choices[0]?.message?.content?.trim() || '';
    
    // Validate character count
    if (hookText.length > 279) {
      console.warn(`Generated hook too long (${hookText.length} chars), truncating...`);
      return hookText.substring(0, 276) + '...';
    }
    
    if (hookText.length < 140) {
      console.warn(`Generated hook too short (${hookText.length} chars): ${hookText}`);
    }

    return hookText;
  } catch (error) {
    console.error('Error generating custom hook:', error);
    throw error;
  }
}

// Generate template-based hook with character optimization
async function generateTemplateHook({
  template,
  content,
  contentAnalysis,
  personalContext,
  globalRules,
  toneExamples,
  variation
}: {
  template: any;
  content: string;
  contentAnalysis: ContentAnalysis;
  personalContext?: string;
  globalRules?: string;
  toneExamples?: string;
  variation: 1 | 2;
}) {
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

  const variationText = variation === 1 
    ? "First variation: Focus on maximum impact and viral potential."
    : "Second variation: Focus on being more relatable and conversational.";

  let prompt = `You are an expert Twitter thread writer. Use this template to create a hook (opening tweet) for the given content.

Template: ${template.template}
Template Category: ${template.category}
Template Summary: ${template.summary}

Content to adapt:
${content}${personalContextText}${globalRulesText}${toneExamplesText}

Content Analysis:
- Tone: ${contentAnalysis.tone}
- Has personal story: ${contentAnalysis.hasPersonalStory}
- Has statistics: ${contentAnalysis.hasStatistics}
- Main topics: ${contentAnalysis.mainTopics.join(', ')}

CRITICAL CHARACTER REQUIREMENTS:
- The hook must be between 140-279 characters (aim for 200-260 for optimal engagement)
- Count characters carefully including spaces and punctuation
- If the hook approaches 280 characters, make it more concise
- Never exceed 279 characters under any circumstances

TONE AND STYLE REQUIREMENTS:
${toneExamples ? '- MATCH THE EXACT TONE AND STYLE from the provided examples above' : '- Use an engaging, conversational tone that matches the content'}
- Write in the same voice, style, and personality as shown in the examples
- Use similar sentence structure, vocabulary, and writing patterns
- Maintain the same level of formality/informality as the examples
- If examples are casual, be casual. If examples are professional, be professional.

Instructions:
${variationText}

Adapt the template creatively to fit your content. Replace placeholders like [Topic], [Number], [Outcome] etc. with specific details from your content.

IMPORTANT: Return ONLY the hook text, no quotes, no explanations, no additional formatting.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 150,
    });

    const hookText = completion.choices[0]?.message?.content?.trim() || '';
    
    // Validate character count
    if (hookText.length > 279) {
      console.warn(`Generated hook too long (${hookText.length} chars), truncating...`);
      return hookText.substring(0, 276) + '...';
    }
    
    if (hookText.length < 140) {
      console.warn(`Generated hook too short (${hookText.length} chars): ${hookText}`);
    }

    return hookText;
  } catch (error) {
    console.error('Error generating template hook:', error);
    throw error;
  }
}

// Generate power hook-based hook with maximum viral potential
async function generatePowerHook({
  powerHookMatch,
  content,
  contentAnalysis,
  personalContext,
  globalRules,
  toneExamples,
  supportingTemplate,
  variation
}: {
  powerHookMatch: PowerHookMatch;
  content: string;
  contentAnalysis: ContentAnalysis;
  personalContext?: string;
  globalRules?: string;
  toneExamples?: string;
  supportingTemplate?: any;
  variation: 1;
}) {
  const { powerHook, variableData } = powerHookMatch;
  
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

  // Fill in variables in the power hook
  let filledPowerHook = powerHook.text;
  for (const [variable, value] of Object.entries(variableData)) {
    filledPowerHook = filledPowerHook.replace(`[${variable}]`, value);
  }

  const supportingTemplateText = supportingTemplate 
    ? `\n\nOptional Supporting Structure (use for inspiration if helpful):
Template: ${supportingTemplate.template}
Category: ${supportingTemplate.category}`
    : '';

  let prompt = `You are an expert viral Twitter hook writer. Create a powerful, attention-grabbing hook using this POWER HOOK as your foundation.

POWER HOOK FOUNDATION: "${filledPowerHook}"
Power Hook Category: ${powerHook.category}
Power Hook Type: ${powerHook.type}

Content to reference:
${content}${personalContextText}${globalRulesText}${toneExamplesText}${supportingTemplateText}

Content Analysis:
- Tone: ${contentAnalysis.tone}
- Has personal story: ${contentAnalysis.hasPersonalStory}
- Has statistics: ${contentAnalysis.hasStatistics}
- Main topics: ${contentAnalysis.mainTopics.join(', ')}

CRITICAL REQUIREMENTS:
1. CHARACTER LIMIT: Must be between 140-279 characters (aim for 220-260 for maximum engagement)
2. USE THE POWER HOOK: Your hook MUST start with or be heavily based on the power hook foundation above
3. VIRAL POTENTIAL: This needs to stop the scroll and create immediate curiosity
4. CONTENT CONNECTION: Connect the power hook to the specific content provided

TONE AND STYLE REQUIREMENTS:
${toneExamples ? '- MATCH THE EXACT TONE AND STYLE from the provided examples above' : '- Use an engaging, conversational tone that matches the content'}
- Write in the same voice, style, and personality as shown in the examples
- Use similar sentence structure, vocabulary, and writing patterns
- Maintain the same level of formality/informality as the examples

POWER HOOK GUIDELINES:
- ${powerHook.category} hooks should create ${powerHook.type === 'subversive' ? 'challenge conventional thinking' : powerHook.type === 'confrontational' ? 'bold, attention-grabbing statements' : powerHook.type === 'shocking' ? 'surprising revelations' : powerHook.type === 'revealing' ? 'insider knowledge sharing' : 'powerful emotional connection'}
- Make it impossible to scroll past
- Create immediate curiosity gap
- Promise valuable insight or revelation

Example approach: Start with the power hook, then add a brief teaser about what you'll reveal.

IMPORTANT: Return ONLY the final hook text, no quotes, no explanations, no additional formatting.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.75, // Balanced creativity for viral potential
      max_tokens: 150,
    });

    const hookText = completion.choices[0]?.message?.content?.trim() || '';
    
    // Validate character count
    if (hookText.length > 279) {
      console.warn(`Generated power hook too long (${hookText.length} chars), truncating...`);
      return hookText.substring(0, 276) + '...';
    }
    
    if (hookText.length < 140) {
      console.warn(`Generated power hook too short (${hookText.length} chars): ${hookText}`);
    }

    return hookText;
  } catch (error) {
    console.error('Error generating power hook:', error);
    throw error;
  }
}