import type { ExtractedContent } from './index'

export async function extractFromYoutube(url: string): Promise<ExtractedContent> {
  try {
    // Extract video ID from URL
    const videoId = extractVideoId(url)
    if (!videoId) {
      throw new Error('Invalid YouTube URL')
    }

    // Dynamic import to handle potential server-side issues
    let transcript
    try {
      const { YoutubeTranscript } = await import('youtube-transcript')
      transcript = await YoutubeTranscript.fetchTranscript(videoId)
    } catch (importError) {
      console.error('YouTube transcript import failed:', importError)
      throw new Error('YouTube transcript extraction is not available. Please copy and paste the video content directly.')
    }
    
    // Combine transcript text
    const content = transcript
      .map(item => item.text)
      .join(' ')
      .replace(/\[.*?\]/g, '') // Remove timestamp markers
      .trim()

    // Get video title (simplified - in a real app, you'd use YouTube API)
    const title = await getVideoTitle(videoId)

    return {
      type: 'youtube',
      title: title || 'YouTube Video',
      content,
      url
    }
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