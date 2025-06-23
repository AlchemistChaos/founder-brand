'use client'

import { useState } from 'react'
import ContentInput from '@/components/ContentInput'
import ThreadTypeSelector from '@/components/ThreadTypeSelector'
import CustomPromptSelector from '@/components/CustomPromptSelector'
import ResultsDisplay from '@/components/ResultsDisplay'
import SettingsModal from '@/components/SettingsModal'

export default function Home() {
  const [content, setContent] = useState('')
  const [threadType, setThreadType] = useState('summary')
  const [usePersonalContext, setUsePersonalContext] = useState(false)
  const [customPromptId, setCustomPromptId] = useState<string>('')
  const [useEnhancedHooks, setUseEnhancedHooks] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [results, setResults] = useState<{
    thread: string[]
    artPrompts: string[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  const handleGenerate = async () => {
    if (!content.trim()) return

    setIsGenerating(true)
    setResults(null)
    setError(null)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          threadType,
          usePersonalContext,
          customPromptId: customPromptId || undefined,
          useEnhancedHooks,
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Generation failed')
      }
      
      setResults(data)
    } catch (error) {
      console.error('Generation failed:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <main className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 mb-8">
        <ContentInput
          content={content}
          setContent={setContent}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />
        
        <div className="flex items-center justify-between mt-4 mb-6">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={usePersonalContext}
              onChange={(e) => setUsePersonalContext(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              🧠 Use Personal Context
            </span>
          </label>
          
          <button
            onClick={() => setShowSettings(true)}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ⚙️ Settings
          </button>
        </div>

        <ThreadTypeSelector
          selectedType={threadType}
          onTypeChange={setThreadType}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 mb-8">
        <CustomPromptSelector
          selectedPromptId={customPromptId}
          onPromptChange={setCustomPromptId}
          useEnhancedHooks={useEnhancedHooks}
          onEnhancedHooksChange={setUseEnhancedHooks}
        />
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <div className="text-red-500 text-xl">⚠️</div>
            <div>
              <h3 className="text-red-800 dark:text-red-300 font-medium mb-2">
                Generation Failed
              </h3>
              <p className="text-red-700 dark:text-red-400 text-sm mb-3">
                {error}
              </p>
              <div className="text-red-600 dark:text-red-400 text-xs">
                <p className="mb-1">💡 <strong>Workaround:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Visit the article directly and copy the text content</li>
                  <li>Paste the copied text into the input field above</li>
                  <li>Try again with the raw text instead of the URL</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {results && <ResultsDisplay results={results} />}

      {showSettings && (
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </main>
  )
}