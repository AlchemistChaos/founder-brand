'use client'

import { useState, useEffect } from 'react'
import { TwitterThread, Hook } from '@/lib/types'
import EditableTweet from './EditableTweet'

interface ResultsDisplayProps {
  threads?: TwitterThread[]
  selectedHooks?: Hook[]
  personalContext?: string
  globalRules?: string
  onThreadsChange?: (threads: TwitterThread[]) => void
  // Legacy support for old format
  results?: {
    thread: string[]
    artPrompts: string[]
  }
}

export default function ResultsDisplay({ 
  threads, 
  selectedHooks, 
  personalContext,
  globalRules,
  onThreadsChange,
  results 
}: ResultsDisplayProps) {
  const [copiedThread, setCopiedThread] = useState<string | null>(null)
  const [copiedPrompts, setCopiedPrompts] = useState(false)
  const [editableThreads, setEditableThreads] = useState<TwitterThread[]>(threads || [])

  // Update editable threads when props change
  useEffect(() => {
    if (threads) {
      setEditableThreads(threads)
    }
  }, [threads])

  // Handle tweet updates
  const handleTweetChange = (threadId: string, tweetIndex: number, newText: string) => {
    const updatedThreads = editableThreads.map(thread => {
      if (thread.id === threadId) {
        const updatedTweets = [...thread.tweets]
        updatedTweets[tweetIndex] = newText
        return { ...thread, tweets: updatedTweets }
      }
      return thread
    })
    
    setEditableThreads(updatedThreads)
    onThreadsChange?.(updatedThreads)
  }

  const copyToClipboard = async (text: string, type: 'thread' | 'prompts', threadId?: string) => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'thread' && threadId) {
        setCopiedThread(threadId)
        setTimeout(() => setCopiedThread(null), 2000)
      } else if (type === 'prompts') {
        setCopiedPrompts(true)
        setTimeout(() => setCopiedPrompts(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  // Legacy support for old format
  if (results && !threads) {
    const threadText = results.thread.join('\n\n')
    const promptsText = results.artPrompts.join('\n\n')

    return (
      <div className="space-y-6">
        {/* Legacy Twitter Thread */}
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

        {/* Legacy AI Art Prompts */}
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

  // New format with hook-based threads
  if (!editableThreads || editableThreads.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 dark:text-gray-400">
          No threads generated yet.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Your Generated Threads
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {editableThreads.length} thread{editableThreads.length !== 1 ? 's' : ''} generated from your selected hooks
        </p>
      </div>

      {/* Selected Hooks Preview */}
      {selectedHooks && selectedHooks.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">
            📌 Selected Hooks
          </h3>
          <div className="space-y-2">
            {selectedHooks.map((hook) => (
              <div key={hook.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {hook.type === 'custom' ? '✨ Creative' : '📝 Template'}
                  </span>
                  {hook.templateTitle && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      • {hook.templateTitle}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                  {hook.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Threads Display */}
      <div className="space-y-8">
        {editableThreads.map((thread, index) => {
          const threadText = thread.tweets.join('\n\n')
          const correspondingHook = selectedHooks?.find(h => h.id === thread.hookId)
          
          return (
            <div key={thread.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Thread {index + 1}
                  </h3>
                  {correspondingHook && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      From: {correspondingHook.type === 'custom' ? 'Creative Hook' : correspondingHook.templateTitle}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => copyToClipboard(threadText, 'thread', thread.id)}
                  className={`px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm ${
                    copiedThread === thread.id
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
                  }`}
                >
                  <span>{copiedThread === thread.id ? '✅' : '📋'}</span>
                  <span>{copiedThread === thread.id ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              {/* Hook Preview */}
              {correspondingHook && (
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mb-4">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Hook used:</div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                    {correspondingHook.text}
                  </div>
                </div>
              )}
              
              {/* Thread Content */}
              <div className="space-y-4">
                {thread.tweets.map((tweet, tweetIndex) => {
                  const threadContext = editableThreads.map(t => t.tweets).flat()
                  return (
                    <EditableTweet
                      key={`${thread.id}-${tweetIndex}`}
                      tweetText={tweet}
                      tweetIndex={tweetIndex}
                      totalTweets={thread.tweets.length}
                      threadContext={threadContext}
                      personalContext={personalContext}
                      globalRules={globalRules}
                      onTweetChange={(newText) => handleTweetChange(thread.id, tweetIndex, newText)}
                    />
                  )
                })}
              </div>

              {/* Thread Stats */}
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{thread.tweets.length} tweets</span>
                  <span>{threadText.length} total characters</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Art Prompts (if available) */}
      {editableThreads.some(t => t.artPrompts && t.artPrompts.length > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              🎨 AI Art Prompts
            </h3>
            <button
              onClick={() => {
                const allPrompts = editableThreads
                  .flatMap(t => t.artPrompts || [])
                  .join('\n\n')
                copyToClipboard(allPrompts, 'prompts')
              }}
              className={`px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm ${
                copiedPrompts
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
              }`}
            >
              <span>{copiedPrompts ? '✅' : '📋'}</span>
              <span>{copiedPrompts ? 'Copied!' : 'Copy All'}</span>
            </button>
          </div>
          
          <div className="space-y-3">
            {editableThreads.flatMap(t => t.artPrompts || []).map((prompt, index) => (
              <div
                key={index}
                className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700"
              >
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Prompt {index + 1}
                </div>
                <div className="text-gray-900 dark:text-white font-mono text-sm">
                  {prompt}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}