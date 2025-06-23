import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get('videoId')
  const transcriptUrl = searchParams.get('transcriptUrl')
  
  if (!videoId && !transcriptUrl) {
    return Response.json({ error: 'videoId or transcriptUrl parameter is required' }, { status: 400 })
  }
  
  try {
    let targetUrl: string
    
    if (transcriptUrl) {
      // Proxy transcript XML request
      targetUrl = decodeURIComponent(transcriptUrl)
    } else {
      // Proxy video page request
      targetUrl = `https://www.youtube.com/watch?v=${videoId}`
    }
    
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Upgrade-Insecure-Requests': '1'
      },
      redirect: 'follow'
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const content = await response.text()
    
    return new Response(content, {
      headers: {
        'Content-Type': transcriptUrl ? 'application/xml' : 'text/html',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
  } catch (error) {
    console.error('YouTube proxy error:', error)
    return Response.json({ 
      error: 'Failed to fetch from YouTube',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}