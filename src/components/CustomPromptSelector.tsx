'use client'

import { useState, useEffect } from 'react'

interface CustomPrompt {
  id: string
  name: string
  description: string
  system_prompt: string
  is_active: boolean
}

interface CustomPromptSelectorProps {
  selectedPromptId: string
  onPromptChange: (promptId: string) => void
  useEnhancedHooks: boolean
  onEnhancedHooksChange: (enabled: boolean) => void
}

export default function CustomPromptSelector({ 
  selectedPromptId, 
  onPromptChange, 
  useEnhancedHooks, 
  onEnhancedHooksChange 
}: CustomPromptSelectorProps) {
  const [prompts, setPrompts] = useState<CustomPrompt[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadPrompts()
  }, [])

  const loadPrompts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/custom-prompts')
      const data = await response.json()
      
      if (response.ok) {
        setPrompts(data.prompts || [])
      } else {
        console.error('Failed to load custom prompts:', data.error)
      }
    } catch (error) {
      console.error('Error loading custom prompts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          ⚡ Enhanced Features
        </h3>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useEnhancedHooks}
              onChange={(e) => onEnhancedHooksChange(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              🎯 Enhanced Hooks (100+)
            </span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          📝 Custom Prompt Style
        </label>
        <select
          value={selectedPromptId}
          onChange={(e) => onPromptChange(e.target.value)}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          disabled={isLoading}
        >
          <option value="">🎨 Default Thread Style</option>
          {prompts.map((prompt) => (
            <option key={prompt.id} value={prompt.id}>
              {prompt.name}
            </option>
          ))}
        </select>
        
        {selectedPromptId && (
          <div className="mt-2">
            {(() => {
              const selectedPrompt = prompts.find(p => p.id === selectedPromptId)
              return selectedPrompt ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedPrompt.description}
                </p>
              ) : null
            })()}
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
        <p className="mb-1"><strong>Enhanced Hooks:</strong> Uses 100+ unique hook variations for better engagement</p>
        <p><strong>Custom Prompts:</strong> Specialized styles for viral content, education, or personal branding</p>
      </div>
    </div>
  )
}