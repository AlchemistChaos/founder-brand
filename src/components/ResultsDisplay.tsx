'use client'

import { useState } from 'react'

interface ResultsDisplayProps {
  results: {
    thread: string[]
    artPrompts: string[]
  }
}

export default function ResultsDisplay({ results }: ResultsDisplayProps) {
  const [copiedThread, setCopiedThread] = useState(false)
  const [copiedPrompts, setCopiedPrompts] = useState(false)

  const copyToClipboard = async (text: string, type: 'thread' | 'prompts') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'thread') {
        setCopiedThread(true)
        setTimeout(() => setCopiedThread(false), 2000)
      } else {
        setCopiedPrompts(true)
        setTimeout(() => setCopiedPrompts(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const threadText = results.thread.join('\n\n')
  const promptsText = results.artPrompts.join('\n\n')

  return (
    <div className="space-y-6">
      {/* Twitter Thread */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            📝 Twitter Thread
          </h2>
          <button
            onClick={() => copyToClipboard(threadText, 'thread')}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
              copiedThread
                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
            }`}
          >
            <span>{copiedThread ? '✅' : '📋'}</span>
            <span>{copiedThread ? 'Copied!' : 'Copy Thread'}</span>
          </button>
        </div>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {results.thread.map((tweet, index) => (
            <div
              key={index}
              className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700"
            >
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Tweet {index + 1}/{results.thread.length}
              </div>
              <div className="text-gray-900 dark:text-white whitespace-pre-wrap">
                {tweet}
              </div>
              <div className="text-xs text-gray-400 mt-2">
                {tweet.length} characters
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Art Prompts */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            🎨 AI Art Prompts
          </h2>
          <button
            onClick={() => copyToClipboard(promptsText, 'prompts')}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
              copiedPrompts
                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
            }`}
          >
            <span>{copiedPrompts ? '✅' : '📋'}</span>
            <span>{copiedPrompts ? 'Copied!' : 'Copy Prompts'}</span>
          </button>
        </div>
        
        <div className="space-y-4">
          {results.artPrompts.map((prompt, index) => (
            <div
              key={index}
              className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700"
            >
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Prompt {index + 1}
              </div>
              <div className="text-gray-900 dark:text-white font-mono text-sm">
                {prompt}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}