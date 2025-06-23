import * as pdfjsLib from 'pdfjs-dist'
import type { ExtractedContent } from './index'

// Set up the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

export async function extractFromPDF(pdfData: string | ArrayBuffer): Promise<ExtractedContent> {
  try {
    let pdfBuffer: ArrayBuffer
    
    if (typeof pdfData === 'string') {
      // Handle our custom PDF format: PDF:filename:base64data
      if (pdfData.startsWith('PDF:')) {
        const parts = pdfData.split(':')
        const base64 = parts[2]
        pdfBuffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer
      } else if (pdfData.startsWith('data:application/pdf;base64,')) {
        const base64 = pdfData.split(',')[1]
        pdfBuffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer
      } else {
        // Convert string to ArrayBuffer
        pdfBuffer = new TextEncoder().encode(pdfData).buffer
      }
    } else {
      pdfBuffer = pdfData
    }

    const pdf = await pdfjsLib.getDocument({ data: pdfBuffer }).promise
    let fullText = ''
    
    // Extract text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
      
      fullText += pageText + '\n\n'
    }
    
    // Clean up the extracted text
    const content = fullText
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n\n') // Clean up line breaks
      .trim()
    
    if (!content) {
      throw new Error('No text could be extracted from the PDF')
    }
    
    return {
      type: 'pdf',
      title: 'PDF Document',
      content
    }
  } catch (error) {
    console.error('PDF extraction failed:', error)
    throw new Error('Failed to extract PDF content. Please ensure the PDF contains selectable text.')
  }
}