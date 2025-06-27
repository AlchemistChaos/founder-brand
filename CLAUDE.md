# CLAUDE.md - Codebase Guide

This document explains how the **founder-brand** codebase works for AI assistants and developers.

## Project Overview

**founder-brand** is a Next.js 15 application that transforms content (YouTube videos, articles, PDFs, text) into Twitter threads and AI art prompts using OpenAI's GPT-4.

## Architecture

### Tech Stack
- **Framework**: Next.js 15 + TypeScript + React 19
- **Styling**: Tailwind CSS v4
- **AI**: OpenAI GPT-4 API
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel-optimized

### Directory Structure
```
src/
├── app/                   # Next.js App Router
│   ├── api/              # API endpoints
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx         # Main app page
├── components/           # React components
├── lib/                 # Core utilities
│   ├── ai/              # AI generation logic
│   ├── extractors/      # Content extraction
│   └── *.ts            # Database/config files
```

## Core Workflow

### 1. Content Input (`/src/components/ContentInput.tsx`)
Handles 4 input types:
- **YouTube URLs**: Extracts transcripts client/server-side
- **Article URLs**: Scrapes content via proxy
- **PDF Upload**: Extracts text using pdfjs-dist
- **Raw Text**: Direct input

### 2. Content Extraction (`/src/lib/extractors/`)
- **`index.ts`**: Orchestrates all extraction methods
- **YouTube**: Client-side (`/src/lib/youtube-client.ts`) + server-side fallback
- **Articles**: Server-side scraping with Cheerio via `/api/proxy`
- **PDFs**: Client-side processing with pdfjs-dist worker

### 3. AI Generation (`/src/lib/ai/generator.ts`)
- Uses OpenAI GPT-4 API
- Generates Twitter threads (10 different styles)
- Creates AI art prompts (2-3 per generation)
- Integrates personal context and custom prompts

### 4. Hook System (`/src/lib/hooks.ts`)
- 100+ curated Twitter thread opening hooks
- AI-powered relevance matching
- Categorized by content type and tone

## API Endpoints

### `/api/generate` (POST)
Main generation endpoint:
```typescript
// Request
{
  content: string;
  threadType: ThreadType;
  personalContext?: string;
  customPromptId?: string;
}

// Response
{
  threads: TwitterThread[];
  artPrompts: string[];
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
YouTube content proxy for server-side extraction

## Database Schema (Supabase)

### `user_contexts`
```sql
id: uuid PRIMARY KEY
user_id: text
context_data: text
created_at: timestamp
updated_at: timestamp
```

### `custom_prompts`
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

### `ContentInput.tsx`
- Multi-format input handling
- File upload processing
- URL validation and extraction
- Error handling with user feedback

### `ThreadTypeSelector.tsx`
Thread style options:
- Summary, Listicle, Myth-busting
- Inspirational, Narrative, Q&A
- Controversial, Analysis, Ideas, Curated

### `CustomPromptSelector.tsx`
- Lists available custom prompts
- Allows selection for generation
- Integrates with custom prompt API

### `ResultsDisplay.tsx`
- Displays generated threads and art prompts
- Copy-to-clipboard functionality
- Formatted output with proper styling

### `SettingsModal.tsx`
- Personal context management
- Custom prompt CRUD operations
- Application configuration

## Environment Variables

Required in `.env.local`:
```bash
OPENAI_API_KEY=your_openai_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

## Development Commands

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
```

## Error Handling

The application implements comprehensive error handling:
- Content extraction failures fall back to alternative methods
- API errors are caught and displayed to users
- Client-side errors are handled gracefully
- Network issues are handled with retry logic

## Performance Optimizations

- **Next.js 15**: Optimized rendering and routing
- **Streaming**: Content processing happens progressively
- **Caching**: API responses cached where appropriate
- **Code Splitting**: Components loaded on demand
- **External Packages**: pdfjs-dist configured as external

## Testing

- `/api/test` endpoint for API testing
- Error simulation for testing error handling
- Client-side validation before API calls

## Deployment Notes

- **Configured for Vercel**: `next.config.js` optimized
- **Environment Variables**: Set in Vercel dashboard
- **Database**: Supabase hosted PostgreSQL
- **Cost Estimate**: ~$15-25/month for moderate usage

## Common Issues & Solutions

1. **YouTube Extraction Fails**: Falls back to server-side proxy
2. **CORS Issues**: Uses `/api/proxy` for article fetching
3. **PDF Processing**: Worker configured in `public/` directory
4. **OpenAI Rate Limits**: Handled with proper error messaging

## Code Patterns

- **Async/Await**: Used throughout for API calls
- **Error Boundaries**: React error handling
- **TypeScript**: Strict typing for all components
- **Modular Design**: Clear separation of concerns
- **Progressive Enhancement**: Fallbacks for failed operations

This codebase follows modern React/Next.js best practices with a focus on reliability, user experience, and maintainability.