# Code Explanation - Technical Deep Dive

This document provides detailed technical explanations of the founder-brand codebase implementation.

## Application Architecture Overview

### New 3-Step Workflow System

The application has evolved from a simple content-to-thread generator into a sophisticated 3-step workflow:

1. **Content Input**: Multi-format content extraction and processing
2. **Hook Generation**: AI-powered template matching and hook creation  
3. **Thread Generation**: Hook-specific Twitter thread creation

### State Management (`page.tsx`)

```typescript
export default function Home() {
  // Step management
  const [currentStep, setCurrentStep] = useState<GenerationStep>('input')
  
  // Content and context
  const [content, setContent] = useState('')
  const [usePersonalContext, setUsePersonalContext] = useState(false)
  const [customPromptId, setCustomPromptId] = useState<string>('')
  
  // Hook generation results
  const [hooks, setHooks] = useState<Hook[]>([])
  const [topTemplates, setTopTemplates] = useState<TemplateMatch[]>([])
  const [contentAnalysis, setContentAnalysis] = useState<ContentAnalysis | null>(null)
  
  // Hook selection
  const [selectedHookIds, setSelectedHookIds] = useState<string[]>([])
  
  // Thread generation results
  const [threads, setThreads] = useState<TwitterThread[]>([])
  
  // Loading and error states
  const [isGeneratingHooks, setIsGeneratingHooks] = useState(false)
  const [isGeneratingThreads, setIsGeneratingThreads] = useState(false)
  const [hookError, setHookError] = useState<string | null>(null)
  const [threadError, setThreadError] = useState<string | null>(null)
}
```

## Content Processing Pipeline

### YouTube Content Extraction

#### Client-Side Extraction (`youtube-client.ts`)
```typescript
export class YouTubeClientExtractor {
  static extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  static async extractFromUrl(url: string): Promise<YouTubeExtractResult> {
    const videoId = this.extractVideoId(url);
    if (!videoId) throw new Error('Invalid YouTube URL');
    
    // Client-side extraction using YouTube's internal APIs
    return await this.extractTranscript(videoId);
  }
}
```

#### Extraction Orchestrator (`extractors/index.ts`)
```typescript
export async function extractContent(input: string): Promise<ExtractedContent> {
  const trimmedInput = input.trim()
  
  // YouTube URLs - try client-side first, server fallback
  if (isYouTubeUrl(trimmedInput)) {
    if (typeof window !== 'undefined') {
      try {
        const youtubeData = await YouTubeClientExtractor.extractFromUrl(trimmedInput)
        return {
          type: 'youtube',
          title: youtubeData.title,
          content: youtubeData.rawTranscript,
          url: trimmedInput
        }
      } catch (clientError) {
        // Fallback to server-side extraction
        return await extractFromYoutube(trimmedInput)
      }
    }
  }
  
  // Web articles
  if (isWebUrl(trimmedInput)) {
    return await extractFromArticle(trimmedInput)
  }
  
  // Default to raw text
  return {
    type: 'text',
    content: trimmedInput
  }
}
```

### Article Content Extraction

#### CORS Proxy Implementation (`/api/proxy/route.ts`)
```typescript
export async function GET(request: NextRequest) {
  const targetUrl = request.nextUrl.searchParams.get('url');
  
  if (!targetUrl) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ContentExtractor/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Remove unwanted elements
    $('script, style, nav, header, footer, .sidebar, .advertisement, .ads').remove();
    
    // Try multiple content selectors
    const contentSelectors = [
      'article', '[role="main"]', '.content', '.post-content',
      '.entry-content', '.article-content', 'main', '.story-body'
    ];
    
    let extractedContent = '';
    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        extractedContent = element.text().trim();
        if (extractedContent.length > 100) break;
      }
    }
    
    return NextResponse.json({
      content: extractedContent.replace(/\s+/g, ' ').trim(),
      title: $('title').text() || $('h1').first().text() || 'Extracted Article'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}
```

### PDF Processing (`ContentInput.tsx`)

```typescript
const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    const result = e.target?.result
    if (file.type === 'application/pdf') {
      try {
        const arrayBuffer = result as ArrayBuffer
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise
        
        let extractedText = ''
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const textContent = await page.getTextContent()
          
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ')
          
          extractedText += pageText + '\n\n'
        }
        
        setContent(extractedText.trim())
      } catch (error) {
        console.error('PDF extraction failed:', error)
      }
    }
  }
  
  if (file.type === 'application/pdf') {
    reader.readAsArrayBuffer(file)
  } else {
    reader.readAsText(file)
  }
}
```

## Hook Generation System

### Template Matching Engine (`templates-simple.ts`)

#### Template Structure
```typescript
export interface TwitterTemplate {
  id: string;
  title: string;
  summary: string;
  template: string; // Contains placeholders like [Topic], [X], [Insight1]
  category: string;
}

export const TWITTER_TEMPLATES: TwitterTemplate[] = [
  {
    id: "life-lessons",
    title: "Life Lessons",
    summary: "Share important life lessons that changed your perspective.",
    template: `Here are [X] life lessons that completely changed my perspective on [Topic]:

1. [Lesson1]
[Explanation1]

2. [Lesson2]
[Explanation2]

The biggest takeaway: [MainTakeaway]`,
    category: "Advice & Life Lessons"
  },
  // ... 50+ more templates
];
```

#### Content Analysis Algorithm
```typescript
export function analyzeContent(content: string): ContentAnalysis {
  const wordCount = content.split(' ').length;
  
  // Detect personal story elements
  const hasPersonalStory = /\b(I|my|me|myself)\b/gi.test(content);
  
  // Detect statistics and data
  const hasStatistics = /\b\d+%|\b\d+\s+(percent|times|years|months)\b/gi.test(content);
  
  // Detect quoted content
  const hasQuotes = /"[^"]*"/g.test(content);
  
  // Sentiment analysis
  const positiveWords = /\b(success|great|amazing|excellent|best|love)\b/gi;
  const negativeWords = /\b(fail|failure|mistake|wrong|bad|problem)\b/gi;
  
  const positiveMatches = (content.match(positiveWords) || []).length;
  const negativeMatches = (content.match(negativeWords) || []).length;
  
  let tone = 'neutral';
  if (positiveMatches > negativeMatches) tone = 'positive';
  if (negativeMatches > positiveMatches) tone = 'negative';
  
  // Topic extraction
  const topics = [];
  if (/\b(business|startup|entrepreneur)\b/gi.test(content)) topics.push('business');
  if (/\b(learn|education|study|skill)\b/gi.test(content)) topics.push('learning');
  // ... more topic detection
  
  return {
    tone,
    hasPersonalStory,
    hasStatistics,
    hasQuotes,
    mainTopics: topics,
    wordCount,
    sentiment: tone as 'positive' | 'negative' | 'neutral'
  };
}
```

#### Template Scoring System
```typescript
export function getTemplateMatches(content: string, limit: number = 5): TemplateMatch[] {
  const analysis = analyzeContent(content);
  const matches: TemplateMatch[] = [];
  
  for (const template of TWITTER_TEMPLATES) {
    let score = 0;
    const reasons: string[] = [];
    
    // Category-based scoring
    if (analysis.hasPersonalStory && template.category === 'Personal Story') {
      score += 30;
      reasons.push('Contains personal story elements');
    }
    
    if (analysis.mainTopics.includes('advice') && template.category === 'Advice & Life Lessons') {
      score += 25;
      reasons.push('Content provides advice or lessons');
    }
    
    if (analysis.hasStatistics && template.template.includes('[Statistics]')) {
      score += 20;
      reasons.push('Contains statistical data');
    }
    
    // Topic relevance scoring
    for (const topic of analysis.mainTopics) {
      if (template.template.toLowerCase().includes(topic)) {
        score += 15;
        reasons.push(`Relevant to ${topic} topic`);
      }
    }
    
    // Content length compatibility
    if (analysis.wordCount > 200 && template.category === 'Educational Breakdown') {
      score += 10;
      reasons.push('Sufficient content for breakdown format');
    }
    
    matches.push({ template, score, reasons });
  }
  
  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
```

### Hook Generation API (`/api/generate-hooks/route.ts`)

#### Main Generation Flow
```typescript
export async function POST(request: NextRequest) {
  try {
    const { content, personalContext, globalRules } = await request.json();
    
    // Step 1: Analyze content and get top 5 templates
    const contentAnalysis = analyzeContent(content);
    const templateMatches = getTemplateMatches(content, 5);
    
    // Step 2: Generate hooks from top 4 templates (2 variations each = 8 hooks)
    const templateHooks: Hook[] = [];
    
    for (let i = 0; i < Math.min(4, templateMatches.length); i++) {
      const match = templateMatches[i];
      const template = match.template;
      
      // Extract placeholder data for this template
      const placeholderData = extractPlaceholderData(content, template.template);
      
      // Generate 2 variations for this template
      for (let variation = 1; variation <= 2; variation++) {
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
      }
    }
    
    // Step 3: Generate 2 custom creative hooks
    const customHooks: Hook[] = [];
    
    for (let variation = 1; variation <= 2; variation++) {
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
    }
    
    const allHooks = [...templateHooks, ...customHooks];
    
    return NextResponse.json({
      hooks: allHooks.slice(0, 10),
      topTemplates: templateMatches,
      contentAnalysis
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate hooks' }, { status: 500 });
  }
}
```

#### Template Hook Generation
```typescript
async function generateTemplateHook({
  content,
  template,
  placeholderData,
  personalContext,
  globalRules,
  variation
}: {
  content: string;
  template: TwitterTemplate;
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
    : "Create an alternative hook with a different angle while following the template.";

  const prompt = `You are an expert Twitter thread writer. Generate a compelling hook based on this template.

Template: ${template.title}
Template Category: ${template.category}
Template Structure: ${template.template.split('\n').slice(0, 3).join('\n')}...

Content to base hook on:
${content}

Extracted Data:
${Object.entries(placeholderData).map(([key, value]) => `${key}: ${value}`).join('\n')}

${variationPrompt}

Requirements:
- Hook must be under 280 characters
- Must be engaging and attention-grabbing
- Should match the template style and tone
- Include 1-2 relevant emojis
- End with a clear setup for the thread${personalContextText}${globalRulesText}

Generate only the hook text, nothing else:`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 150,
  });

  return response.choices[0].message.content?.trim() || '';
}
```

#### Custom Hook Generation
```typescript
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

  const variationPrompt = variation === 1
    ? "Create a creative, engaging hook that captures the essence of the content."
    : "Create an alternative creative hook with a different approach or angle.";

  const prompt = `You are an expert Twitter thread writer. Create an original, creative hook for this content.

Content Analysis:
- Tone: ${contentAnalysis.tone}
- Has Personal Story: ${contentAnalysis.hasPersonalStory}
- Has Statistics: ${contentAnalysis.hasStatistics}
- Main Topics: ${contentAnalysis.mainTopics.join(', ')}
- Word Count: ${contentAnalysis.wordCount}

Content:
${content}

${variationPrompt}

Requirements:
- Hook must be under 280 characters
- Must be original and creative (not following any template)
- Should be highly engaging and attention-grabbing
- Include 1-2 relevant emojis
- Must capture the key insight or value proposition
- End with a clear setup for the thread${personalContextText}${globalRulesText}

Generate only the hook text, nothing else:`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.9,
    max_tokens: 150,
  });

  return response.choices[0].message.content?.trim() || '';
}
```

## Thread Generation System

### Enhanced Generator (`lib/ai/generator.ts`)

#### Hook-Based Thread Generation
```typescript
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

    // Build system prompt with global rules
    const globalRulesText = globalRules ? `

CRITICAL GLOBAL RULES (MUST FOLLOW):
${globalRules}` : ''

    const systemPrompt = customPrompt || `You are an expert Twitter thread creator.${globalRulesText}

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

    const threadText = response.choices[0].message.content || ''
    
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
```

### Art Prompt Generation
```typescript
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

    const promptsText = response.choices[0].message.content || ''
    
    // Extract individual prompts
    const prompts = promptsText
      .split('/imagine prompt:')
      .map(prompt => prompt.trim())
      .filter(prompt => prompt.length > 0)
      .map(prompt => `/imagine prompt: ${prompt}`)

    return prompts.slice(0, 3) // Return max 3 prompts
  } catch (error) {
    console.error('Art prompt generation failed:', error)
    return []
  }
}
```

## UI Components Deep Dive

### Hook Selection Interface (`HookSelector.tsx`)

```typescript
export default function HookSelector({
  hooks,
  selectedHookIds,
  onHookSelect,
  onGenerateThreads,
  isLoading = false,
  maxSelection = 2
}: HookSelectorProps) {
  const isSelectionComplete = selectedHookIds.length === maxSelection
  const canGenerate = isSelectionComplete && !isLoading

  const handleHookSelect = (hookId: string) => {
    const isSelected = selectedHookIds.includes(hookId)
    
    if (isSelected) {
      // Deselect hook
      onHookSelect(hookId)
    } else {
      // Select hook (if under limit)
      if (selectedHookIds.length < maxSelection) {
        onHookSelect(hookId)
      }
    }
  }

  const templateHooks = hooks.filter(hook => hook.type === 'template')
  const customHooks = hooks.filter(hook => hook.type === 'custom')

  return (
    <div className="space-y-6">
      {/* Selection Counter */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-blue-800 font-medium">
            {selectedHookIds.length} of {maxSelection} hooks selected
          </span>
          <div className="flex space-x-1">
            {Array.from({ length: maxSelection }).map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index < selectedHookIds.length
                    ? 'bg-blue-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Template Hooks Section */}
      {templateHooks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            📝 Template-Based Hooks
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templateHooks.map((hook) => (
              <HookCard
                key={hook.id}
                hook={hook}
                isSelected={selectedHookIds.includes(hook.id)}
                onSelect={handleHookSelect}
                disabled={!selectedHookIds.includes(hook.id) && selectedHookIds.length >= maxSelection}
                showTemplateInfo={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Custom Hooks Section */}
      {customHooks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            ✨ Creative Hooks
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customHooks.map((hook) => (
              <HookCard
                key={hook.id}
                hook={hook}
                isSelected={selectedHookIds.includes(hook.id)}
                onSelect={handleHookSelect}
                disabled={!selectedHookIds.includes(hook.id) && selectedHookIds.length >= maxSelection}
                showTemplateInfo={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Generate Button */}
      <div className="flex justify-center pt-6">
        <button
          onClick={onGenerateThreads}
          disabled={!canGenerate}
          className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all ${
            canGenerate
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>Generating Threads...</span>
            </div>
          ) : (
            `Generate Threads (${selectedHookIds.length}/${maxSelection})`
          )}
        </button>
      </div>
    </div>
  )
}
```

### Individual Hook Display (`HookCard.tsx`)

```typescript
export default function HookCard({
  hook,
  isSelected,
  onSelect,
  disabled = false,
  showTemplateInfo = true
}: HookCardProps) {
  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      'Personal Story': 'bg-purple-100 text-purple-800',
      'Curation': 'bg-blue-100 text-blue-800',
      'Educational Breakdown': 'bg-green-100 text-green-800',
      'Advice & Life Lessons': 'bg-yellow-100 text-yellow-800',
      // ... more categories
    }
    
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
  }

  return (
    <div
      onClick={() => !disabled && onSelect(hook.id)}
      className={`group relative p-4 rounded-lg border-2 transition-all cursor-pointer ${
        disabled
          ? 'opacity-50 cursor-not-allowed border-gray-200'
          : isSelected
          ? 'border-blue-500 bg-blue-50 shadow-lg'
          : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
      }`}
    >
      {/* Selection Indicator */}
      <div className="absolute top-3 right-3">
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
          isSelected
            ? 'bg-blue-500 border-blue-500 text-white'
            : 'border-gray-300 group-hover:border-blue-400'
        }`}>
          {isSelected && (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>

      {/* Hook Type & Score */}
      <div className="flex items-center space-x-2 mb-3">
        <span className="text-lg">{hook.type === 'custom' ? '✨' : '📝'}</span>
        <span className="text-xs font-medium text-gray-500">
          {hook.type === 'custom' ? 'Creative' : 'Template'} • Variation {hook.variation}
        </span>
        {hook.score && (
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
            {Math.round(hook.score)}% match
          </span>
        )}
      </div>

      {/* Template Info */}
      {showTemplateInfo && hook.templateTitle && hook.templateCategory && (
        <div className="mb-3">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryColor(hook.templateCategory)}`}>
            {hook.templateCategory}
          </span>
          <div className="text-sm font-medium text-gray-700 mt-1">
            {hook.templateTitle}
          </div>
        </div>
      )}

      {/* Hook Text */}
      <div className="text-gray-900">
        <p className="text-sm leading-relaxed">
          {truncateText(hook.text)}
        </p>
      </div>

      {/* Hover Expansion for Long Hooks */}
      {hook.text.length > 150 && (
        <div className="absolute inset-0 p-4 bg-white border-2 border-blue-500 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
          <div className="h-full overflow-y-auto">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {hook.text}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
```

## Configuration & Deployment

### Next.js Configuration (`next.config.js`)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pdfjs-dist'] // Handle PDF.js as external package
}

module.exports = nextConfig
```

### Database Configuration (`supabase.ts`)
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface UserContext {
  id?: string
  content: string
  created_at?: string
}
```

## Performance Optimizations

### Client-Side Processing
- **PDF extraction**: Happens entirely in browser using pdfjs-dist
- **YouTube extraction**: Client-side first, server fallback
- **No file uploads**: PDFs processed locally for security

### Parallel Hook Generation
- Template matching runs concurrently with content analysis
- Multiple OpenAI API calls run in parallel for hook variations
- Error handling allows partial failures without breaking the flow

### Efficient State Management
- Single source of truth in main page component
- Minimal re-renders with proper state segmentation
- Loading states prevent redundant API calls

## Error Handling Strategy

### Multi-Layer Fallbacks
1. **YouTube**: Client → Server → Manual
2. **Articles**: Proxy → Direct fetch → Manual
3. **Hook Generation**: Template failure doesn't stop custom hooks

### User Experience
- Clear error messages with actionable advice
- Graceful degradation when services fail
- Loading states with progress indicators
- Copy-to-clipboard feedback

This technical implementation represents a sophisticated content transformation pipeline with AI-powered personalization and robust error handling throughout the user journey.