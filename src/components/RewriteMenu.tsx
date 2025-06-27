'use client'

import { useState, useEffect, useRef } from 'react'

export interface RewriteOption {
  id: 'grammar' | 'improve' | 'punchy' | 'condense' | 'rephrase'
  label: string
  icon: string
  description: string
}

interface RewriteMenuProps {
  isVisible: boolean
  position: { x: number; y: number }
  selectedText: string
  onRewrite: (type: RewriteOption['id'], customPrompt?: string) => void
  onClose: () => void
  isRewriting?: boolean
}

const REWRITE_OPTIONS: RewriteOption[] = [
  {
    id: 'grammar',
    label: 'Fix grammar',
    icon: '✓',
    description: 'Correct grammar and spelling errors'
  },
  {
    id: 'improve',
    label: 'Improve writing',
    icon: '✨',
    description: 'Enhance clarity and flow'
  },
  {
    id: 'punchy',
    label: 'Make it punchier',
    icon: '🎯',
    description: 'More engaging and impactful'
  },
  {
    id: 'condense',
    label: 'Condense',
    icon: '↗',
    description: 'Make it more concise'
  },
  {
    id: 'rephrase',
    label: 'Rephrase / Mix it up',
    icon: '🔄',
    description: 'Fresh perspective, same meaning'
  }
]

export default function RewriteMenu({
  isVisible,
  position,
  selectedText,
  onRewrite,
  onClose,
  isRewriting = false
}: RewriteMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [activeOption, setActiveOption] = useState<string | null>(null)
  const [customPrompt, setCustomPrompt] = useState('')

  // Close menu when clicking outside (but not on input)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isVisible, onClose])

  // Handle custom prompt submission
  const handleCustomPrompt = () => {
    if (!customPrompt.trim() || isRewriting) return
    
    setActiveOption('custom')
    onRewrite('rephrase', customPrompt)
    setCustomPrompt('')
  }

  // Handle Enter key in custom prompt
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCustomPrompt()
    }
  }

  // Adjust menu position to stay within viewport
  const getAdjustedPosition = () => {
    if (!menuRef.current) return position

    const menuRect = menuRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let adjustedX = position.x
    let adjustedY = position.y

    // Adjust horizontal position
    if (position.x + menuRect.width > viewportWidth) {
      adjustedX = viewportWidth - menuRect.width - 10
    }

    // Adjust vertical position
    if (position.y + menuRect.height > viewportHeight) {
      adjustedY = position.y - menuRect.height - 10
    }

    return { x: adjustedX, y: adjustedY }
  }

  if (!isVisible) return null

  const adjustedPosition = getAdjustedPosition()

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl py-2 min-w-[280px]"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
    >
      {/* Header */}
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-600">
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          Rewrite with AI
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
          "{selectedText.slice(0, 50)}..."
        </div>
      </div>

      {/* Search/Custom prompt */}
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-600">
        <input
          ref={inputRef}
          type="text"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search or type a custom prompt..."
          className="w-full text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isRewriting}
        />
      </div>

      {/* Rewrite Options */}
      <div className="py-2">
        {REWRITE_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => {
              if (!isRewriting) {
                setActiveOption(option.id)
                onRewrite(option.id)
              }
            }}
            disabled={isRewriting}
            className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors ${
              isRewriting && activeOption === option.id
                ? 'bg-blue-50 dark:bg-blue-900/20'
                : ''
            } ${
              isRewriting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            }`}
          >
            <span className="text-lg flex-shrink-0 w-6 flex items-center justify-center">
              {isRewriting && activeOption === option.id ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
              ) : (
                option.icon
              )}
            </span>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {option.label}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {option.description}
              </div>
            </div>
          </button>
        ))}
      </div>


    </div>
  )
} 