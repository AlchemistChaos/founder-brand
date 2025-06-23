'use client'

import { useState } from 'react'
import { YouTubeClientExtractor } from '@/lib/youtube-client'
import YouTubeProcessor from './YouTubeProcessor'

interface ContentInputProps {
  content: string
  setContent: (content: string) => void
  onGenerate: () => void
  isGenerating: boolean
}

export default function ContentInput({ 
  content, 
  setContent, 
  onGenerate, 
  isGenerating 
}: ContentInputProps) {
  const [showYouTubeProcessor, setShowYouTubeProcessor] = useState(false)
  const [youtubeUrl, setYoutubeUrl] = useState('')

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    
    // Check if it's a YouTube URL
    const videoId = YouTubeClientExtractor.extractVideoId(newContent.trim())
    if (videoId && newContent.trim() !== youtubeUrl) {
      setYoutubeUrl(newContent.trim())
      setShowYouTubeProcessor(true)
    } else if (!videoId) {
      setShowYouTubeProcessor(false)
      setYoutubeUrl('')
    }
  }

  const handleTranscriptExtracted = (transcript: string, title: string) => {
    setContent(transcript)
    setShowYouTubeProcessor(false)
    // Show success message briefly
  }

  const handleYouTubeError = (error: string) => {
    setShowYouTubeProcessor(false)
    // Keep the original URL in case user wants to try something else
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (file.type === 'application/pdf') {
        // For PDFs, we'll pass the ArrayBuffer directly to the extraction engine
        const uint8Array = new Uint8Array(result as ArrayBuffer)
        const binary = Array.from(uint8Array, byte => String.fromCharCode(byte)).join('')
        setContent(`PDF:${file.name}:${btoa(binary)}`)
      } else {
        // For text files, read as text
        setContent(result as string)
      }
    }
    
    if (file.type === 'application/pdf') {
      reader.readAsArrayBuffer(file)
    } else {
      reader.readAsText(file)
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="🔗 Paste YouTube link, article URL, or raw text..."
          className="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
          {content.length} characters
        </div>
      </div>

      {showYouTubeProcessor && (
        <YouTubeProcessor
          url={youtubeUrl}
          onTranscriptExtracted={handleTranscriptExtracted}
          onError={handleYouTubeError}
        />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <label className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
            📄 Upload PDF
            <input
              type="file"
              accept=".pdf,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <button
          onClick={onGenerate}
          disabled={!content.trim() || isGenerating}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              <span>Generating...</span>
            </>
          ) : (
            <>
              <span>✨ Generate Thread & Art Prompts</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}