// Client-side YouTube transcript extraction
export interface YouTubeTranscriptItem {
  text: string
  start: number
  duration: number
}

export interface YouTubeVideoInfo {
  title: string
  videoId: string
  transcript: YouTubeTranscriptItem[]
  rawTranscript: string
}

export class YouTubeClientExtractor {
  private static readonly YOUTUBE_BASE_URL = 'https://www.youtube.com'
  
  static extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
      /youtu\.be\/([^&\n?#]+)/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    
    return null
  }

  static async extractTranscript(videoId: string): Promise<YouTubeVideoInfo> {
    try {
      // Step 1: Get video page HTML via server-side proxy (CORS-safe)
      let html: string
      
      console.log('Fetching video data via proxy for video:', videoId)
      const proxyResponse = await fetch(`/api/youtube-proxy?videoId=${videoId}`)
      
      if (!proxyResponse.ok) {
        const errorData = await proxyResponse.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(`Proxy fetch failed: ${proxyResponse.status} - ${errorData.error || 'Unknown error'}`)
      }
      
      html = await proxyResponse.text()
      
      // Step 2: Extract video title
      const title = this.extractTitle(html)
      
      // Step 3: Extract transcript data
      const transcript = await this.extractTranscriptFromHtml(html, videoId)
      
      // Step 4: Process transcript into readable text
      const rawTranscript = transcript
        .map(item => item.text)
        .join(' ')
        .replace(/\[.*?\]/g, '') // Remove timestamp markers
        .replace(/\s+/g, ' ') // Clean up spaces
        .trim()
      
      return {
        title,
        videoId,
        transcript,
        rawTranscript
      }
      
    } catch (error) {
      console.error('YouTube extraction failed:', error)
      throw new Error('Failed to extract transcript. This video may not have captions available.')
    }
  }

  private static extractTitle(html: string): string {
    // Try multiple methods to extract title
    const titlePatterns = [
      /<title>([^<]+)<\/title>/,
      /"title":"([^"]+)"/,
      /'title':'([^']+)'/,
      /property="og:title" content="([^"]+)"/
    ]
    
    for (const pattern of titlePatterns) {
      const match = html.match(pattern)
      if (match) {
        return match[1]
          .replace(' - YouTube', '')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&amp;/g, '&')
          .trim()
      }
    }
    
    return 'YouTube Video'
  }

  private static async extractTranscriptFromHtml(html: string, videoId: string): Promise<YouTubeTranscriptItem[]> {
    try {
      console.log('Attempting to extract transcript from HTML for video:', videoId)
      
      // Method 1: Try to find captions tracks in the HTML
      const captionsMatch = html.match(/"captions":\s*({[^{}]*?"captionTracks":\s*\[[^\]]*?\][^{}]*?})/)
      
      if (captionsMatch) {
        try {
          console.log('Found captions data, parsing...')
          const captionsData = JSON.parse(captionsMatch[1])
          const tracks = captionsData.playerCaptionsTracklistRenderer?.captionTracks
          
          if (tracks && tracks.length > 0) {
            console.log(`Found ${tracks.length} caption tracks`)
            // Prefer English captions, fallback to first available
            const englishTrack = tracks.find((track: any) => 
              track.languageCode === 'en' || track.languageCode === 'en-US'
            ) || tracks[0]
            
            if (englishTrack?.baseUrl) {
              console.log('Using caption track:', englishTrack.languageCode || 'unknown')
              return await this.fetchTranscriptFromUrl(englishTrack.baseUrl)
            }
          }
        } catch (parseError) {
          console.warn('Failed to parse captions data from method 1:', parseError)
        }
      }

      // Method 2: Try alternative extraction from ytInitialPlayerResponse
      console.log('Trying alternative extraction method...')
      const playerResponseMatch = html.match(/var ytInitialPlayerResponse = ({.*?});/)
      
      if (playerResponseMatch) {
        try {
          const playerResponse = JSON.parse(playerResponseMatch[1])
          const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks
          
          if (captions && captions.length > 0) {
            console.log(`Found ${captions.length} caption tracks via method 2`)
            const track = captions.find((t: any) => t.languageCode === 'en') || captions[0]
            if (track?.baseUrl) {
              console.log('Using caption track from method 2:', track.languageCode || 'unknown')
              return await this.fetchTranscriptFromUrl(track.baseUrl)
            }
          }
        } catch (parseError) {
          console.warn('Failed to parse player response from method 2:', parseError)
        }
      }

      // Method 3: Try window.ytInitialPlayerResponse pattern
      console.log('Trying window.ytInitialPlayerResponse pattern...')
      const windowPlayerMatch = html.match(/window\["ytInitialPlayerResponse"\]\s*=\s*({.*?});/)
      
      if (windowPlayerMatch) {
        try {
          const playerResponse = JSON.parse(windowPlayerMatch[1])
          const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks
          
          if (captions && captions.length > 0) {
            console.log(`Found ${captions.length} caption tracks via method 3`)
            const track = captions.find((t: any) => t.languageCode === 'en') || captions[0]
            if (track?.baseUrl) {
              console.log('Using caption track from method 3:', track.languageCode || 'unknown')
              return await this.fetchTranscriptFromUrl(track.baseUrl)
            }
          }
        } catch (parseError) {
          console.warn('Failed to parse window player response from method 3:', parseError)
        }
      }

      throw new Error('No captions found - this video may not have transcripts available')
      
    } catch (error) {
      console.error('Transcript extraction error for video', videoId, ':', error)
      throw new Error('Unable to extract transcript from this video. Please ensure the video has captions enabled.')
    }
  }

  private static async fetchTranscriptFromUrl(url: string): Promise<YouTubeTranscriptItem[]> {
    try {
      let xmlText: string
      
      // Use server-side proxy for transcript URLs (CORS-safe)
      console.log('Fetching transcript via proxy from:', url)
      const proxyResponse = await fetch(`/api/youtube-proxy?transcriptUrl=${encodeURIComponent(url)}`)
      
      if (!proxyResponse.ok) {
        const errorData = await proxyResponse.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(`Proxy transcript fetch failed: ${proxyResponse.status} - ${errorData.error || 'Unknown error'}`)
      }
      
      xmlText = await proxyResponse.text()
      
      // Parse XML transcript
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml')
      const textElements = xmlDoc.querySelectorAll('text')
      
      const transcript: YouTubeTranscriptItem[] = []
      
      textElements.forEach(element => {
        const text = element.textContent || ''
        const start = parseFloat(element.getAttribute('start') || '0')
        const duration = parseFloat(element.getAttribute('dur') || '0')
        
        if (text.trim()) {
          transcript.push({
            text: text.trim(),
            start,
            duration
          })
        }
      })
      
      return transcript
      
    } catch (error) {
      console.error('Failed to fetch transcript from URL:', error)
      throw new Error('Failed to download transcript data')
    }
  }

  static async extractFromUrl(url: string): Promise<YouTubeVideoInfo> {
    const videoId = this.extractVideoId(url)
    
    if (!videoId) {
      throw new Error('Invalid YouTube URL format')
    }
    
    return await this.extractTranscript(videoId)
  }
}