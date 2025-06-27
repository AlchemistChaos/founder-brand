# CLAUDE.md - Codebase Guide

This document explains how the **founder-brand** codebase works for AI assistants and developers.

## Project Overview

**founder-brand** is a Next.js 15 application that transforms content (YouTube videos, articles, PDFs, text) into Twitter threads and AI art prompts using OpenAI's GPT-4. The app features an advanced hook-based generation system with template matching and personal context integration.

## Architecture

### Tech Stack
- **Framework**: Next.js 15 + TypeScript + React 19
- **Styling**: Tailwind CSS v4
- **AI**: OpenAI GPT-4 API
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel-optimized
- **PDF Processing**: pdfjs-dist (client-side)

### Directory Structure
```
src/
├── app/                   # Next.js App Router
│   ├── api/              # API endpoints
│   │   ├── generate/     # Main thread generation
│   │   ├── generate-hooks/ # Hook generation system
│   │   ├── custom-prompts/ # Custom prompt CRUD
│   │   ├── proxy/        # CORS proxy for articles
│   │   └── youtube-proxy/ # YouTube transcript fallback
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx         # Main app page (3-step workflow)
├── components/           # React components
│   ├── ContentInput.tsx  # Multi-format content input
│   ├── HookSelector.tsx  # Hook selection interface
│   ├── HookCard.tsx     # Individual hook display
│   ├── ResultsDisplay.tsx # Thread results display
│   ├── YouTubeProcessor.tsx # YouTube extraction UI
│   └── SettingsModal.tsx # Settings and context management
├── lib/                 # Core utilities
│   ├── ai/              # AI generation logic
│   │   └── generator.ts  # Thread & art prompt generation
│   ├── extractors/      # Content extraction
│   │   ├── index.ts     # Extraction orchestrator
│   │   ├── youtube.ts   # YouTube extraction
│   │   ├── article.ts   # Article scraping
│   │   └── pdf.ts       # PDF processing
│   ├── templates-simple.ts # Template matching system
│   ├── types.ts         # TypeScript interfaces
│   ├── supabase.ts      # Database client
│   └── youtube-client.ts # Client-side YouTube extraction
```

## Core Workflow (3-Step Process)

### Step 1: Content Input (`ContentInput.tsx`)
Handles 4 input types:
- **YouTube URLs**: Client-side extraction with server fallback
- **Article URLs**: Server-side scraping via proxy
- **PDF Upload**: Client-side text extraction using pdfjs-dist
- **Raw Text**: Direct input

### Step 2: Hook Generation (`/api/generate-hooks`)
**NEW FEATURE**: AI-powered hook selection system
1. **Content Analysis**: Analyzes input for themes, tone, and structure
2. **Template Matching**: Scores 50+ templates against content using semantic matching
3. **Hook Generation**: Creates 10 hooks (8 template-based + 2 creative)
   - 4 top templates × 2 variations each = 8 template hooks
   - 2 custom creative hooks from Claude
4. **Selection Interface**: User selects exactly 2 hooks for thread generation

### Step 3: Thread Generation (`/api/generate`)
- Generates 2 Twitter threads from selected hooks
- Includes AI art prompts (2-3 per thread)
- Integrates personal context and global rules
- Supports custom prompt templates

## API Endpoints

### `/api/generate-hooks` (POST)
**NEW**: Hook generation endpoint
```typescript
// Request
{
  content: string;
  personalContext?: string;
  globalRules?: string;
}

// Response
{
  hooks: Hook[];
  topTemplates: TemplateMatch[];
  contentAnalysis: ContentAnalysis;
}
```

### `/api/generate` (POST)
Main thread generation endpoint (supports both legacy and new formats):
```typescript
// New hook-based format
{
  content: string;
  selectedHookIds: string[]; // Exactly 2 hook IDs
  personalContext?: string;
  globalRules?: string;
  customPromptId?: string;
}

// Response
{
  threads: TwitterThread[];
  selectedHooks: Hook[];
}
```

### `/api/custom-prompts` (GET/POST/PUT/DELETE)
CRUD operations for custom prompt templates

### `/api/proxy` (GET)
CORS proxy for article fetching:
```typescript
// Usage: /api/proxy?url=https://example.com
```

### `/api/youtube-proxy` (GET)
YouTube content proxy for server-side extraction fallback

## Database Schema (Supabase)

### `user_contexts`
```sql
id: uuid PRIMARY KEY
content: text -- Stores personal context or global rules
created_at: timestamp
```

### `custom_prompts` (Referenced but not fully implemented)
```sql
id: uuid PRIMARY KEY
user_id: text
name: text
prompt_template: text
style_type: text
created_at: timestamp
updated_at: timestamp
```

## Key Components

### `page.tsx` - Main Application
- **3-step workflow**: input → hooks → threads
- **State management**: Multi-step form with loading states
- **Navigation**: Step-by-step progression with back buttons

### `ContentInput.tsx`
- Multi-format input handling with auto-detection
- YouTube URL detection triggers automatic processing
- PDF upload with client-side text extraction
- File upload support for PDFs and text files

### `HookSelector.tsx`
**NEW COMPONENT**: Hook selection interface
- Displays 10 generated hooks in grid layout
- Template vs. custom hook differentiation
- Exactly 2 hook selection requirement
- Visual feedback for selection state

### `HookCard.tsx`
**NEW COMPONENT**: Individual hook display
- Template category and score display
- Hover expansion for long hooks
- Selection state management
- Visual category color coding

### `ResultsDisplay.tsx`
- Updated to support new hook-based thread format
- Displays multiple threads with source hook information
- Copy-to-clipboard functionality
- Legacy format backward compatibility

### `YouTubeProcessor.tsx`
- Real-time YouTube extraction feedback
- Progress indicators and error handling
- Client-side extraction with visual status

## Template System (`templates-simple.ts`)

### Template Categories
- Personal Story
- Curation
- Educational Breakdown
- Advice & Life Lessons
- Social Proof / Spotlight
- Book-Based
- Insight & Prediction
- Meta / Reflection on Writing

### Template Matching Algorithm
1. **Content Analysis**: Extracts themes, tone, personal elements
2. **Semantic Scoring**: Matches content to template patterns
3. **Relevance Ranking**: Scores templates 0-100 based on fit
4. **Top Selection**: Returns top 5 templates for hook generation

## Content Extraction Pipeline

### YouTube Extraction
1. **Client-side first**: `YouTubeClientExtractor` (fastest)
2. **Server fallback**: `/api/youtube-proxy` if client fails
3. **Error handling**: Graceful degradation with user guidance

### Article Extraction (`/api/proxy`)
```typescript
// Uses Cheerio for content parsing
const contentSelectors = [
  'article', '[role="main"]', '.content', 
  '.post-content', '.entry-content', 'main'
];
```

### PDF Processing
- **Client-side only**: Uses pdfjs-dist worker
- **Security**: No server upload required
- **Performance**: Processes locally in browser

## AI Generation System

### Hook Generation
- **Template hooks**: Fill template placeholders with content-specific data
- **Creative hooks**: GPT-4 generates original hooks based on content analysis
- **Personalization**: Integrates user context and global rules
- **Variation**: 2 variations per template for diversity

### Thread Generation
- **Hook-specific**: Each thread built around selected hook
- **Style consistency**: Maintains hook tone throughout thread
- **Structure**: 8-12 tweets with proper numbering
- **Art prompts**: 2-3 Midjourney-style prompts per thread

## Environment Variables

Required in `.env.local`:
```bash
OPENAI_API_KEY=your_openai_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

## Type System (`types.ts`)

### Core Types
```typescript
interface Hook {
  id: string;
  text: string;
  templateId?: string;
  templateTitle?: string;
  templateCategory?: string;
  variation: 1 | 2;
  type: 'template' | 'custom';
  score?: number;
}

interface TwitterThread {
  id: string;
  hookId: string;
  tweets: string[];
  templateId?: string;
  templateTitle?: string;
  artPrompts?: string[];
}

type GenerationStep = 'input' | 'hooks' | 'threads';
```

## Development Commands

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
```

## Performance Optimizations

- **Next.js 15**: Latest optimizations and React 19
- **Client-side processing**: PDF and YouTube extraction in browser
- **Parallel extraction**: Multiple content sources handled simultaneously
- **Code splitting**: Components loaded on demand
- **Streaming responses**: Real-time feedback during processing

## Error Handling

- **Multi-layered fallbacks**: Client → Server → Manual guidance
- **Graceful degradation**: Partial failures don't break workflow
- **User feedback**: Clear error messages with actionable advice
- **Retry logic**: Automatic retries for transient failures

## Recent Architecture Changes

1. **Hook-based generation**: Replaced single thread generation with 10-hook selection
2. **Template system**: Added 50+ templates with semantic matching
3. **3-step workflow**: Clear progression from content → hooks → threads
4. **Enhanced UI**: Dedicated components for each step
5. **Better extraction**: Improved YouTube and article processing
6. **Personal context**: Global rules and context integration

## Testing & Debugging

- `/api/test` endpoint for API testing
- Hook generation debugging in `/api/generate-debug`
- Client-side extraction testing in YouTube processor
- Error simulation for testing error handling paths

## Deployment Notes

- **Vercel optimized**: `next.config.js` configured for deployment
- **External packages**: pdfjs-dist handled as external dependency
- **Environment variables**: Set in Vercel dashboard
- **Database**: Supabase hosted PostgreSQL with RLS disabled for simplicity