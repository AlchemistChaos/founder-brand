'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import RewriteMenu, { RewriteOption } from './RewriteMenu'

interface EditableTweetProps {
  tweetText: string
  tweetIndex: number
  totalTweets: number
  threadContext?: string[]
  personalContext?: string
  globalRules?: string
  onTweetChange: (newText: string) => void
  isEditing?: boolean
  onEditToggle?: () => void
}

interface TextSelection {
  text: string
  start: number
  end: number
}

export default function EditableTweet({
  tweetText,
  tweetIndex,
  totalTweets,
  threadContext = [],
  personalContext,
  globalRules,
  onTweetChange,
  isEditing = false,
  onEditToggle
}: EditableTweetProps) {
  const [currentText, setCurrentText] = useState(tweetText)
  const [isRewriting, setIsRewriting] = useState(false)
  const [showRewriteMenu, setShowRewriteMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const [selectedText, setSelectedText] = useState<TextSelection | null>(null)
  const [isLocalEditing, setIsLocalEditing] = useState(false)
  
  const tweetRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Update local text when prop changes
  useEffect(() => {
    setCurrentText(tweetText)
  }, [tweetText])

  // Handle text selection
  const handleTextSelection = useCallback(() => {
    if (isLocalEditing) return // Don't show rewrite menu in edit mode

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      setShowRewriteMenu(false)
      setSelectedText(null)
      return
    }

    const range = selection.getRangeAt(0)
    const text = selection.toString().trim()
    
    if (text.length < 3) {
      setShowRewriteMenu(false)
      setSelectedText(null)
      return
    }

    // Check if selection is within our tweet
    if (!tweetRef.current?.contains(range.commonAncestorContainer)) {
      setShowRewriteMenu(false)
      setSelectedText(null)
      return
    }

    // Get selection position for menu placement
    const rect = range.getBoundingClientRect()
    const menuX = rect.left + (rect.width / 2)
    const menuY = rect.bottom + 10

    setSelectedText({
      text,
      start: range.startOffset,
      end: range.endOffset
    })
    setMenuPosition({ x: menuX, y: menuY })
    setShowRewriteMenu(true)
  }, [isLocalEditing])

  // Handle text selection events
  useEffect(() => {
    const handleSelectionChange = () => {
      // Delay to allow selection to complete
      setTimeout(handleTextSelection, 100)
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }, [handleTextSelection])

  // Handle rewrite request
  const handleRewrite = async (rewriteType: RewriteOption['id'], customPrompt?: string) => {
    if (!selectedText || isRewriting) return

    setIsRewriting(true)

    try {
      const response = await fetch('/api/rewrite-tweet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedText: selectedText.text,
          fullTweet: currentText,
          rewriteType,
          customPrompt,
          threadContext,
          personalContext,
          globalRules
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Rewrite failed')
      }

      // Replace the selected text with the rewritten version
      const beforeText = currentText.substring(0, currentText.indexOf(selectedText.text))
      const afterText = currentText.substring(currentText.indexOf(selectedText.text) + selectedText.text.length)
      const newText = beforeText + data.rewrittenText + afterText

      setCurrentText(newText)
      onTweetChange(newText)
      setShowRewriteMenu(false)
      setSelectedText(null)

      // Clear selection
      window.getSelection()?.removeAllRanges()

    } catch (error) {
      console.error('Rewrite failed:', error)
      // Show error message
    } finally {
      setIsRewriting(false)
    }
  }

  // Handle manual editing
  const handleEditStart = () => {
    setIsLocalEditing(true)
    setShowRewriteMenu(false)
    setSelectedText(null)
    onEditToggle?.()
  }

  const handleEditSave = () => {
    setIsLocalEditing(false)
    onTweetChange(currentText)
    onEditToggle?.()
  }

  const handleEditCancel = () => {
    setCurrentText(tweetText) // Reset to original
    setIsLocalEditing(false)
    onEditToggle?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleEditSave()
    } else if (e.key === 'Escape') {
      handleEditCancel()
    }
  }

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [currentText, isLocalEditing])

  const characterCount = currentText.length
  const isOverLimit = characterCount > 280

  return (
    <div className="relative">
      <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
        {/* Tweet Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Tweet {tweetIndex + 1}/{totalTweets}
          </div>
          <div className="flex items-center space-x-2">
            <div className={`text-xs ${isOverLimit ? 'text-red-500' : 'text-gray-400'}`}>
              {characterCount}/280
            </div>
            {!isLocalEditing ? (
              <button
                onClick={handleEditStart}
                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300"
              >
                Edit
              </button>
            ) : (
              <div className="flex space-x-1">
                <button
                  onClick={handleEditSave}
                  disabled={isOverLimit}
                  className="text-xs px-2 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded"
                >
                  Save
                </button>
                <button
                  onClick={handleEditCancel}
                  className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tweet Content */}
        {isLocalEditing ? (
          <textarea
            ref={textareaRef}
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full text-gray-900 dark:text-white bg-transparent border-none outline-none resize-none text-sm leading-relaxed"
            placeholder="Write your tweet..."
            autoFocus
          />
        ) : (
          <div
            ref={tweetRef}
            className="text-gray-900 dark:text-white text-sm leading-relaxed whitespace-pre-wrap cursor-text select-text"
            style={{ userSelect: 'text' }}
          >
            {currentText}
          </div>
        )}

        {/* Edit Instructions */}
        {isLocalEditing && (
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            💡 Tip: ⌘+Enter to save, Escape to cancel
          </div>
        )}

        {/* Selection Instructions */}
        {!isLocalEditing && !showRewriteMenu && (
          <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            💡 Select text to rewrite with AI, or click Edit to modify manually
          </div>
        )}
      </div>

      {/* Rewrite Menu */}
      <RewriteMenu
        isVisible={showRewriteMenu}
        position={menuPosition}
        selectedText={selectedText?.text || ''}
        onRewrite={handleRewrite}
        onClose={() => {
          setShowRewriteMenu(false)
          setSelectedText(null)
          window.getSelection()?.removeAllRanges()
        }}
        isRewriting={isRewriting}
      />
    </div>
  )
} 