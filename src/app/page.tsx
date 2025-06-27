'use client'

import { useState } from 'react'
import ContentInput from '@/components/ContentInput'
import HookSelector from '@/components/HookSelector'
import CustomPromptSelector from '@/components/CustomPromptSelector'
import ResultsDisplay from '@/components/ResultsDisplay'
import SettingsModal from '@/components/SettingsModal'
import { GenerationStep, Hook, TwitterThread, TemplateMatch, ContentAnalysis } from '@/lib/types'
import { supabaseClient } from '@/lib/supabase-client'

export default function Home() {
  // Step management
  const [currentStep, setCurrentStep] = useState<GenerationStep>('input')
  
  // Content and context
  const [content, setContent] = useState('')
  const [usePersonalContext, setUsePersonalContext] = useState(false)
  const [customPromptId, setCustomPromptId] = useState<string>('')
  
  // Hook generation results
  const [hooks, setHooks] = useState<Hook[]>([])
  const [topTemplates, setTopTemplates] = useState<TemplateMatch[]>([])
  const [contentAnalysis, setContentAnalysis] = useState<ContentAnalysis | null>(null)
  
  // Hook selection
  const [selectedHookIds, setSelectedHookIds] = useState<string[]>([])
  
  // Thread generation results
  const [threads, setThreads] = useState<TwitterThread[]>([])
  
  // Loading states
  const [isGeneratingHooks, setIsGeneratingHooks] = useState(false)
  const [isGeneratingThreads, setIsGeneratingThreads] = useState(false)
  
  // Error states
  const [hookError, setHookError] = useState<string | null>(null)
  const [threadError, setThreadError] = useState<string | null>(null)
  
  // UI state
  const [showSettings, setShowSettings] = useState(false)

  // Helper function to get personal context
  const getPersonalContext = async (): Promise<string | undefined> => {
    if (!supabaseClient) {
      console.warn('Supabase not configured')
      return undefined
    }
    
    try {
      const { data, error } = await supabaseClient
        .from('user_contexts')
        .select('content')
        .not('content', 'like', 'GLOBAL_RULES:%')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.warn('No personal context found:', error)
        return undefined
      }
      
      return data?.content
    } catch (error) {
      console.error('Error loading personal context:', error)
      return undefined
    }
  }

  // Helper function to get global rules
  const getGlobalRules = async (): Promise<string | undefined> => {
    // Try Supabase first
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('user_contexts')
          .select('content')
          .like('content', 'GLOBAL_RULES:%')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (!error && data?.content) {
          return data.content.replace('GLOBAL_RULES:', '')
        }
      } catch (error) {
        console.warn('Could not load global rules from Supabase, trying localStorage')
      }
    }
    
    // Fallback to localStorage
    try {
      return localStorage.getItem('globalRules') || undefined
    } catch (error) {
      console.warn('Could not load global rules from localStorage')
      return undefined
    }
  }

  // Step 1: Generate hooks from content
  const handleGenerateHooks = async () => {
    if (!content.trim()) return

    setIsGeneratingHooks(true)
    setHookError(null)
    setHooks([])

    try {
      const response = await fetch('/api/generate-hooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          personalContext: usePersonalContext ? await getPersonalContext() : undefined,
          globalRules: await getGlobalRules(),
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Hook generation failed')
      }
      
      setHooks(data.hooks)
      setTopTemplates(data.topTemplates)
      setContentAnalysis(data.contentAnalysis)
      setCurrentStep('hooks')
    } catch (error) {
      console.error('Hook generation failed:', error)
      setHookError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsGeneratingHooks(false)
    }
  }

  // Handle hook selection
  const handleHookSelect = (hookId: string) => {
    const isSelected = selectedHookIds.includes(hookId)
    
    if (isSelected) {
      setSelectedHookIds(prev => prev.filter(id => id !== hookId))
    } else {
      if (selectedHookIds.length < 2) {
        setSelectedHookIds(prev => [...prev, hookId])
      }
    }
  }

  // Step 2: Generate threads from selected hooks
  const handleGenerateThreads = async () => {
    if (selectedHookIds.length !== 2) return

    setIsGeneratingThreads(true)
    setThreadError(null)
    setThreads([])

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          selectedHookIds,
          personalContext: usePersonalContext ? await getPersonalContext() : undefined,
          globalRules: await getGlobalRules(),
          customPromptId: customPromptId || undefined,
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Thread generation failed')
      }
      
      setThreads(data.threads)
      setCurrentStep('threads')
    } catch (error) {
      console.error('Thread generation failed:', error)
      setThreadError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsGeneratingThreads(false)
    }
  }

  // Navigation helpers
  const handleBackToInput = () => {
    setCurrentStep('input')
    setHooks([])
    setSelectedHookIds([])
    setThreads([])
    setHookError(null)
    setThreadError(null)
  }

  const handleBackToHooks = () => {
    setCurrentStep('hooks')
    setSelectedHookIds([])
    setThreads([])
    setThreadError(null)
  }

  const handleStartOver = () => {
    setCurrentStep('input')
    setContent('')
    setHooks([])
    setSelectedHookIds([])
    setThreads([])
    setHookError(null)
    setThreadError(null)
  }

  return (
    <main className="max-w-6xl mx-auto">
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          <div className={`flex items-center space-x-2 ${currentStep === 'input' ? 'text-blue-600' : currentStep === 'hooks' || currentStep === 'threads' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${currentStep === 'input' ? 'bg-blue-100 border-2 border-blue-600' : currentStep === 'hooks' || currentStep === 'threads' ? 'bg-green-100 border-2 border-green-600' : 'bg-gray-100 border-2 border-gray-400'}`}>
              1
            </div>
            <span className="font-medium">Content Input</span>
          </div>
          
          <div className={`w-12 h-1 ${currentStep === 'hooks' || currentStep === 'threads' ? 'bg-green-600' : 'bg-gray-300'}`} />
          
          <div className={`flex items-center space-x-2 ${currentStep === 'hooks' ? 'text-blue-600' : currentStep === 'threads' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${currentStep === 'hooks' ? 'bg-blue-100 border-2 border-blue-600' : currentStep === 'threads' ? 'bg-green-100 border-2 border-green-600' : 'bg-gray-100 border-2 border-gray-400'}`}>
              2
            </div>
            <span className="font-medium">Hook Selection</span>
          </div>
          
          <div className={`w-12 h-1 ${currentStep === 'threads' ? 'bg-green-600' : 'bg-gray-300'}`} />
          
          <div className={`flex items-center space-x-2 ${currentStep === 'threads' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${currentStep === 'threads' ? 'bg-blue-100 border-2 border-blue-600' : 'bg-gray-100 border-2 border-gray-400'}`}>
              3
            </div>
            <span className="font-medium">Thread Results</span>
          </div>
        </div>
      </div>

      {/* Step 1: Content Input */}
      {currentStep === 'input' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
            <ContentInput
              content={content}
              setContent={setContent}
              onGenerate={handleGenerateHooks}
              isGenerating={isGeneratingHooks}
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
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
            <CustomPromptSelector
              selectedPromptId={customPromptId}
              onPromptChange={setCustomPromptId}
              useEnhancedHooks={true} // Always true now
              onEnhancedHooksChange={() => {}} // No-op
            />
          </div>

          {hookError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="text-red-500 text-xl">⚠️</div>
                <div>
                  <h3 className="text-red-800 dark:text-red-300 font-medium mb-2">
                    Hook Generation Failed
                  </h3>
                  <p className="text-red-700 dark:text-red-400 text-sm">
                    {hookError}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Hook Selection */}
      {currentStep === 'hooks' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handleBackToInput}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Content</span>
              </button>
              
              {contentAnalysis && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  📊 Analysis: {contentAnalysis.tone} tone • {contentAnalysis.mainTopics.join(', ')}
                </div>
              )}
            </div>

            <HookSelector
              hooks={hooks}
              selectedHookIds={selectedHookIds}
              onHookSelect={handleHookSelect}
              onGenerateThreads={handleGenerateThreads}
              isLoading={isGeneratingThreads}
            />
          </div>

          {threadError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="text-red-500 text-xl">⚠️</div>
                <div>
                  <h3 className="text-red-800 dark:text-red-300 font-medium mb-2">
                    Thread Generation Failed
                  </h3>
                  <p className="text-red-700 dark:text-red-400 text-sm">
                    {threadError}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Thread Results */}
      {currentStep === 'threads' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handleBackToHooks}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Hooks</span>
              </button>
              
              <button
                onClick={handleStartOver}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                🔄 Start New Generation
              </button>
            </div>

            <ResultsDisplay 
              threads={threads}
              selectedHooks={hooks.filter(h => selectedHookIds.includes(h.id))}
            />
          </div>
        </div>
      )}

      {showSettings && (
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </main>
  )
}