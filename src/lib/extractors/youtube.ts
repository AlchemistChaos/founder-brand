import type { ExtractedContent } from './index'

export async function extractFromYoutube(url: string): Promise<ExtractedContent> {
  try {
    // Extract video ID from URL
    const videoId = extractVideoId(url)
    if (!videoId) {
      throw new Error('Invalid YouTube URL')
    }

    // YouTube transcript package removed due to import issues
    // For now, direct users to copy transcript manually
    throw new Error('YouTube transcript extraction is temporarily unavailable. Please copy and paste the video transcript manually or use the direct caption extraction method.')
  } catch (error) {
    console.error('YouTube extraction failed:', error)
    throw new Error('Failed to extract YouTube content. Make sure the video has captions available.')
  }
}

function extractVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
  const match = url.match(regex)
  return match ? match[1] : null
}

async function getVideoTitle(videoId: string): Promise<string | null> {
  try {
    // This is a simplified approach - in a real app, use YouTube Data API
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
    const data = await response.json()
    return data.title
  } catch {
    return null
  }
}