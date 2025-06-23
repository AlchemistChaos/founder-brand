import { extractFromYoutube } from './youtube'
import { extractFromArticle } from './article'
import { extractFromPDF } from './pdf'
import { YouTubeClientExtractor } from '@/lib/youtube-client'

export interface ExtractedContent {
  type: 'youtube' | 'article' | 'pdf' | 'text'
  title?: string
  content: string
  url?: string
}

export async function extractContent(input: string): Promise<ExtractedContent> {
  const trimmedInput = input.trim()
  
  // Check if it's a YouTube URL - use client-side extraction if available
  if (isYouTubeUrl(trimmedInput)) {
    // Try client-side extraction first (for browser environment)
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
        console.warn('Client-side YouTube extraction failed, trying server-side:', clientError)
        // Fallback to server-side extraction
        try {
          return await extractFromYoutube(trimmedInput)
        } catch (serverError) {
          console.error('Both client and server-side YouTube extraction failed:', serverError)
          throw new Error('Failed to extract YouTube transcript. Please try copying the video transcript manually.')
        }
      }
    } else {
      // Server-side environment - use original method
      return await extractFromYoutube(trimmedInput)
    }
  }
  
  // Check if it's a web article URL
  if (isWebUrl(trimmedInput)) {
    return await extractFromArticle(trimmedInput)
  }
  
  // Check if it's a PDF (this would be handled by file upload)
  if (isPDFContent(trimmedInput)) {
    return await extractFromPDF(trimmedInput)
  }
  
  // Default to treating as raw text
  return {
    type: 'text',
    content: trimmedInput
  }
}

function isYouTubeUrl(url: string): boolean {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i
  return youtubeRegex.test(url)
}

function isWebUrl(url: string): boolean {
  try {
    new URL(url)
    return url.startsWith('http://') || url.startsWith('https://')
  } catch {
    return false
  }
}

function isPDFContent(content: string): boolean {
  return content.startsWith('%PDF-') || content.startsWith('PDF:')
}