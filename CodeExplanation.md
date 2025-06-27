# Code Explanation - Technical Deep Dive

This document provides detailed technical explanations of the founder-brand codebase implementation.

## Content Processing Pipeline

### YouTube Content Extraction

#### Client-Side Extraction (`/src/lib/youtube-client.ts`)
```typescript
// Extract video ID from various YouTube URL formats
const getVideoId = (url: string): string | null => {
  // Handles: youtube.com/watch?v=, youtu.be/, youtube.com/embed/
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
  ];
}

// Client-side transcript extraction using YouTube's internal API
const extractTranscript = async (videoId: string): Promise<string> => {
  // Fetches transcript data directly from YouTube's internal endpoints
  // Falls back to server-side extraction if client-side fails
}
```

#### Server-Side Fallback (`/src/app/api/youtube-proxy/route.ts`)
```typescript
// Proxy endpoint for YouTube content when client-side extraction fails
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  // Extracts content using server-side methods
  // Handles CORS issues and rate limiting
}
```

### Article Content Extraction

#### Proxy-Based Scraping (`/src/app/api/proxy/route.ts`)
```typescript
export async function GET(request: NextRequest) {
  const targetUrl = request.nextUrl.searchParams.get('url');
  
  // Fetch article content
  const response = await fetch(targetUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ContentExtractor/1.0)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  });
  
  // Parse with Cheerio
  const $ = cheerio.load(html);
  
  // Extract main content using multiple selectors
  const contentSelectors = [
    'article', '[role="main"]', '.content', '.post-content',
    '.entry-content', '.article-content', 'main'
  ];
}
```

#### Content Cleaning Logic
```typescript
// Remove unwanted elements
$('script, style, nav, header, footer, .sidebar, .advertisement').remove();

// Extract and clean text
const extractedText = $(selector).text()
  .replace(/\s+/g, ' ')  // Normalize whitespace
  .replace(/\n{3,}/g, '\n\n')  // Limit line breaks
  .trim();
```

### PDF Text Extraction

#### Client-Side Processing (`/src/components/ContentInput.tsx`)
```typescript
const handlePdfUpload = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  
  let extractedText = '';
  
  // Extract text from all pages
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    // Combine text items preserving structure
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    
    extractedText += pageText + '\n\n';
  }
  
  return extractedText.trim();
};
```

#### PDF.js Configuration (`/next.config.js`)
```javascript
const nextConfig = {
  webpack: (config) => {
    // Configure pdfjs-dist as external package
    config.externals = config.externals || [];
    config.externals.push({
      'pdfjs-dist/build/pdf.worker.entry': 'pdfjsWorker'
    });
    return config;
  }
};
```

## AI Generation System

### OpenAI Integration (`/src/lib/ai/generator.ts`)

#### Core Generation Function
```typescript
export async function generateTwitterThreads(
  content: string,
  threadType: ThreadType,
  personalContext?: string,
  customPrompt?: string
): Promise<GenerationResult> {
  
  // Hook selection based on content analysis
  const relevantHooks = await selectRelevantHooks(content, threadType);
  
  // Build context-aware prompt
  const systemPrompt = buildSystemPrompt(threadType, personalContext, customPrompt);
  
  // Generate with OpenAI
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: formatContentForGeneration(content, relevantHooks) }
    ],
    temperature: 0.8,
    max_tokens: 2000
  });
  
  return parseGenerationResult(completion.choices[0].message.content);
}
```

#### Thread Style Prompts
```typescript
const THREAD_STYLES = {
  summary: {
    prompt: "Create a comprehensive summary thread that distills the key points...",
    structure: "Hook + 3-5 key points + actionable takeaway"
  },
  listicle: {
    prompt: "Transform this into an engaging listicle format...",
    structure: "Hook + numbered list + brief explanations"
  },
  mythbusting: {
    prompt: "Identify and debunk common misconceptions...",
    structure: "Hook + myth statements + fact corrections"
  }
  // ... 7 more styles
};
```

### Hook Selection System (`/src/lib/hooks.ts`)

#### Hook Database Structure
```typescript
interface Hook {
  id: string;
  text: string;
  category: 'question' | 'statement' | 'statistic' | 'story' | 'controversial';
  relevanceKeywords: string[];
  tone: 'professional' | 'casual' | 'provocative' | 'inspirational';
}

// 100+ hooks organized by category and tone
const HOOKS: Hook[] = [
  {
    id: 'question_001',
    text: "What if I told you that {topic} isn't what you think it is?",
    category: 'question',
    relevanceKeywords: ['misconception', 'myth', 'surprise', 'unexpected'],
    tone: 'provocative'
  },
  // ... 99+ more hooks
];
```

#### AI-Powered Hook Matching
```typescript
async function selectRelevantHooks(content: string, threadType: ThreadType): Promise<Hook[]> {
  // Analyze content for key themes
  const contentAnalysis = await analyzeContentThemes(content);
  
  // Score hooks based on relevance
  const scoredHooks = HOOKS.map(hook => ({
    ...hook,
    score: calculateRelevanceScore(hook, contentAnalysis, threadType)
  }));
  
  // Return top 3-5 most relevant hooks
  return scoredHooks
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
```

## Database Operations

### Supabase Integration (`/src/lib/supabase.ts`)
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Type-safe database operations
export interface UserContext {
  id: string;
  user_id: string;
  context_data: string;
  created_at: string;
  updated_at: string;
}
```

### Custom Prompts API (`/src/app/api/custom-prompts/route.ts`)
```typescript
// GET - Retrieve all custom prompts
export async function GET() {
  const { data, error } = await supabase
    .from('custom_prompts')
    .select('*')
    .order('created_at', { ascending: false });
  
  return NextResponse.json({ prompts: data || [] });
}

// POST - Create new custom prompt
export async function POST(request: NextRequest) {
  const { name, prompt_template, style_type, user_id } = await request.json();
  
  const { data, error } = await supabase
    .from('custom_prompts')
    .insert({
      name,
      prompt_template,
      style_type,
      user_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  return NextResponse.json({ prompt: data });
}
```

## Frontend Component Architecture

### State Management Patterns

#### ContentInput Component State
```typescript
const [contentType, setContentType] = useState<'url' | 'text' | 'pdf'>('url');
const [content, setContent] = useState('');
const [isExtracting, setIsExtracting] = useState(false);
const [extractionError, setExtractionError] = useState<string | null>(null);

// Content extraction with error handling
const handleExtraction = async () => {
  setIsExtracting(true);
  setExtractionError(null);
  
  try {
    const result = await extractContent(content, contentType);
    onContentExtracted(result);
  } catch (error) {
    setExtractionError(error.message);
  } finally {
    setIsExtracting(false);
  }
};
```

#### ResultsDisplay Component
```typescript
const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({});

const handleCopy = async (text: string, id: string) => {
  await navigator.clipboard.writeText(text);
  setCopiedStates(prev => ({ ...prev, [id]: true }));
  
  // Reset copied state after 2 seconds
  setTimeout(() => {
    setCopiedStates(prev => ({ ...prev, [id]: false }));
  }, 2000);
};
```

### Error Handling Patterns

#### Progressive Enhancement
```typescript
// Try client-side extraction first, fall back to server-side
const extractYouTubeContent = async (url: string): Promise<string> => {
  try {
    // Client-side extraction
    const clientResult = await extractYouTubeTranscriptClient(url);
    if (clientResult) return clientResult;
  } catch (clientError) {
    console.warn('Client-side extraction failed, trying server-side...');
  }
  
  try {
    // Server-side fallback
    const serverResult = await extractYouTubeTranscriptServer(url);
    return serverResult;
  } catch (serverError) {
    throw new Error('Failed to extract YouTube content from both client and server');
  }
};
```

#### User-Friendly Error Messages
```typescript
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    if (error.message.includes('rate limit')) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    if (error.message.includes('network')) {
      return 'Network error. Please check your connection and try again.';
    }
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
};
```

## Performance Optimizations

### Lazy Loading and Code Splitting
```typescript
// Dynamic imports for heavy components
const PDFProcessor = dynamic(() => import('./PDFProcessor'), {
  loading: () => <div>Loading PDF processor...</div>,
  ssr: false
});

// Lazy load pdfjs only when needed
const loadPDFJS = async () => {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  return pdfjsLib;
};
```

### Caching Strategies
```typescript
// Cache extracted content to avoid re-extraction
const contentCache = new Map<string, string>();

const getCachedContent = (url: string): string | null => {
  return contentCache.get(url) || null;
};

const setCachedContent = (url: string, content: string): void => {
  contentCache.set(url, content);
  
  // Limit cache size to prevent memory issues
  if (contentCache.size > 100) {
    const firstKey = contentCache.keys().next().value;
    contentCache.delete(firstKey);
  }
};
```

### Streaming and Progressive Loading
```typescript
// Stream content processing for large files
const processLargeContent = async (content: string, callback: (chunk: string) => void) => {
  const chunkSize = 1000;
  
  for (let i = 0; i < content.length; i += chunkSize) {
    const chunk = content.slice(i, i + chunkSize);
    callback(chunk);
    
    // Allow UI updates between chunks
    await new Promise(resolve => setTimeout(resolve, 0));
  }
};
```

## Security Considerations

### API Route Protection
```typescript
// Rate limiting and input validation
export async function POST(request: NextRequest) {
  // Validate request size
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 1000000) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  }
  
  // Validate input
  const body = await request.json();
  if (!body.content || typeof body.content !== 'string') {
    return NextResponse.json({ error: 'Invalid content' }, { status: 400 });
  }
  
  // Sanitize content
  const sanitizedContent = body.content.replace(/<script[^>]*>.*?<\/script>/gi, '');
  
  // Process request...
}
```

### Environment Variable Validation
```typescript
// Validate required environment variables at startup
const requiredEnvVars = [
  'OPENAI_API_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
```

This technical implementation provides a robust, scalable foundation for content transformation with comprehensive error handling, performance optimization, and security measures.