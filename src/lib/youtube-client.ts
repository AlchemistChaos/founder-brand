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
      // Step 1: Get video page HTML to extract initial data
      // Try direct fetch first, fallback to proxy if CORS issues
      let html: string
      
      try {
        const videoUrl = `${this.YOUTUBE_BASE_URL}/watch?v=${videoId}`
        const response = await fetch(videoUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
          }
        })
        
        if (!response.ok) {
          throw new Error(`Failed to fetch video page: ${response.status}`)
        }
        
        html = await response.text()
      } catch (directFetchError) {
        // Fallback to server-side proxy
        console.warn('Direct fetch failed, trying proxy:', directFetchError)
        const proxyResponse = await fetch(`/api/youtube-proxy?videoId=${videoId}`)
        
        if (!proxyResponse.ok) {
          throw new Error(`Proxy fetch failed: ${proxyResponse.status}`)
        }
        
        html = await proxyResponse.text()
      }
      
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
      // Method 1: Try to find captions tracks in the HTML
      const captionsMatch = html.match(/"captions":({[^}]*?"captionTracks":\[[^\]]*?\][^}]*?})/)
      
      if (captionsMatch) {
        const captionsData = JSON.parse(captionsMatch[1])
        const tracks = captionsData.playerCaptionsTracklistRenderer?.captionTracks
        
        if (tracks && tracks.length > 0) {
          // Prefer English captions, fallback to first available
          const englishTrack = tracks.find((track: any) => 
            track.languageCode === 'en' || track.languageCode === 'en-US'
          ) || tracks[0]
          
          if (englishTrack?.baseUrl) {
            return await this.fetchTranscriptFromUrl(englishTrack.baseUrl)
          }
        }
      }

      // Method 2: Try alternative extraction from ytInitialPlayerResponse
      const playerResponseMatch = html.match(/var ytInitialPlayerResponse = ({.*?});/)
      
      if (playerResponseMatch) {
        const playerResponse = JSON.parse(playerResponseMatch[1])
        const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks
        
        if (captions && captions.length > 0) {
          const track = captions.find((t: any) => t.languageCode === 'en') || captions[0]
          if (track?.baseUrl) {
            return await this.fetchTranscriptFromUrl(track.baseUrl)
          }
        }
      }

      throw new Error('No captions found')
      
    } catch (error) {
      console.error('Transcript extraction error:', error)
      throw new Error('Unable to extract transcript from this video')
    }
  }

  private static async fetchTranscriptFromUrl(url: string): Promise<YouTubeTranscriptItem[]> {
    try {
      let xmlText: string
      
      try {
        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch transcript: ${response.status}`)
        }
        
        xmlText = await response.text()
      } catch (directFetchError) {
        // Fallback to server-side proxy for transcript
        console.warn('Direct transcript fetch failed, trying proxy:', directFetchError)
        const proxyResponse = await fetch(`/api/youtube-proxy?transcriptUrl=${encodeURIComponent(url)}`)
        
        if (!proxyResponse.ok) {
          throw new Error(`Proxy transcript fetch failed: ${proxyResponse.status}`)
        }
        
        xmlText = await proxyResponse.text()
      }
      
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