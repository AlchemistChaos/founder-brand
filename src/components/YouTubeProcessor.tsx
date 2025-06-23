'use client'

import { useState, useEffect } from 'react'
import { YouTubeClientExtractor } from '@/lib/youtube-client'

interface YouTubeProcessorProps {
  url: string
  onTranscriptExtracted: (transcript: string, title: string) => void
  onError: (error: string) => void
}

export default function YouTubeProcessor({ 
  url, 
  onTranscriptExtracted, 
  onError 
}: YouTubeProcessorProps) {
  const [status, setStatus] = useState<'idle' | 'extracting' | 'success' | 'error'>('idle')
  const [progress, setProgress] = useState('')

  useEffect(() => {
    if (url && YouTubeClientExtractor.extractVideoId(url)) {
      extractTranscript()
    }
  }, [url])

  const extractTranscript = async () => {
    setStatus('extracting')
    setProgress('Detecting video...')

    try {
      const videoId = YouTubeClientExtractor.extractVideoId(url)
      if (!videoId) {
        throw new Error('Invalid YouTube URL')
      }

      setProgress('Fetching video data...')
      
      const result = await YouTubeClientExtractor.extractFromUrl(url)
      
      setProgress('Processing transcript...')
      
      if (!result.rawTranscript) {
        throw new Error('No transcript available for this video')
      }

      setStatus('success')
      setProgress('Transcript extracted successfully!')
      
      // Delay to show success message
      setTimeout(() => {
        onTranscriptExtracted(result.rawTranscript, result.title)
      }, 500)

    } catch (error) {
      setStatus('error')
      const errorMessage = error instanceof Error ? error.message : 'Failed to extract transcript'
      setProgress(errorMessage)
      onError(errorMessage)
    }
  }

  if (status === 'idle') return null

  return (
    <div className="mb-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
      <div className="flex items-center space-x-3">
        {status === 'extracting' && (
          <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        )}
        {status === 'success' && (
          <div className="h-5 w-5 text-green-600 flex items-center justify-center">✓</div>
        )}
        {status === 'error' && (
          <div className="h-5 w-5 text-red-600 flex items-center justify-center">✗</div>
        )}
        
        <div className="flex-1">
          <div className="font-medium text-blue-900 dark:text-blue-100">
            🎥 Processing YouTube Video
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">
            {progress}
          </div>
        </div>
      </div>

      {status === 'extracting' && (
        <div className="mt-3 bg-blue-200 dark:bg-blue-800 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full transition-all duration-300 animate-pulse" style={{ width: '60%' }}></div>
        </div>
      )}

      {status === 'error' && (
        <div className="mt-3 text-xs text-blue-600 dark:text-blue-400">
          💡 <strong>Tip:</strong> Try copying the transcript manually from YouTube's transcript feature or use a service like notegpt.io
        </div>
      )}
    </div>
  )
}