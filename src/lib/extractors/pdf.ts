import type { ExtractedContent } from './index'

// Server-side PDF extraction that avoids DOM dependencies
export async function extractFromPDF(pdfData: string | ArrayBuffer): Promise<ExtractedContent> {
  try {
    // For now, we'll disable PDF extraction on the server to avoid DOM errors
    // and suggest the user to copy-paste the content instead
    throw new Error('PDF extraction is temporarily disabled. Please copy and paste the text content from your PDF instead.')
    
    // TODO: Implement server-side PDF extraction using a Node.js compatible library
    // like pdf2pic + tesseract for OCR, or pdf-parse for simple text extraction
    
  } catch (error) {
    console.error('PDF extraction failed:', error)
    
    // Provide helpful error message
    if (error instanceof Error && error.message.includes('temporarily disabled')) {
      throw error
    }
    
    throw new Error('Failed to extract PDF content. Please copy and paste the text from your PDF instead.')
  }
}