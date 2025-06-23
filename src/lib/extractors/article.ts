import * as cheerio from 'cheerio'
import type { ExtractedContent } from './index'

export async function extractFromArticle(url: string): Promise<ExtractedContent> {
  try {
    // Use a CORS proxy for client-side requests
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`
    const response = await fetch(proxyUrl)
    
    if (!response.ok) {
      // Try to get error details from the response
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch article`)
    }
    
    const contentType = response.headers.get('content-type') || ''
    
    // Check if we got JSON (error response) instead of HTML
    if (contentType.includes('application/json')) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to fetch article content')
    }
    
    const html = await response.text()
    
    // Check if we actually got HTML content
    if (!html || html.trim().length === 0) {
      throw new Error('No content received from the URL')
    }
    
    const $ = cheerio.load(html)
    
    // Extract title
    const title = $('title').first().text() || 
                 $('h1').first().text() || 
                 $('meta[property="og:title"]').attr('content') ||
                 'Web Article'
    
    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, .ad, .advertisement, .social-share').remove()
    
    // Extract main content - try multiple selectors
    let content = ''
    const contentSelectors = [
      // Nature.com specific selectors
      '[data-test="article-body"]',
      '.c-article-body',
      '.article__body',
      // Common article selectors
      'article',
      '[role="main"]',
      '.post-content',
      '.entry-content',
      '.article-content',
      '.content',
      'main',
      '.post-body',
      // Additional selectors for news sites
      '.story-body',
      '.article-text',
      '.entry-text',
      '[data-testid="article-body"]'
    ]
    
    for (const selector of contentSelectors) {
      const element = $(selector)
      if (element.length > 0) {
        content = element.text().trim()
        break
      }
    }
    
    // Fallback to body if no specific content found
    if (!content) {
      content = $('body').text().trim()
    }
    
    // Clean up the content
    content = content
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n\n') // Clean up line breaks
      .trim()
    
    if (!content) {
      throw new Error('No content could be extracted from the article')
    }
    
    return {
      type: 'article',
      title: title.trim(),
      content,
      url
    }
  } catch (error) {
    console.error('Article extraction failed:', error)
    throw new Error('Failed to extract article content. Please try copying and pasting the text directly.')
  }
}