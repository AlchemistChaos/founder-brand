'use client'

import { Hook } from '@/lib/types'
import HookCard from './HookCard'

interface HookSelectorProps {
  hooks: Hook[]
  selectedHookIds: string[]
  onHookSelect: (hookId: string) => void
  onGenerateThreads: () => void
  isLoading?: boolean
  maxSelection?: number
}

export default function HookSelector({
  hooks,
  selectedHookIds,
  onHookSelect,
  onGenerateThreads,
  isLoading = false,
  maxSelection = 2
}: HookSelectorProps) {
  const isSelectionComplete = selectedHookIds.length === maxSelection
  const canGenerate = isSelectionComplete && !isLoading

  const handleHookSelect = (hookId: string) => {
    const isSelected = selectedHookIds.includes(hookId)
    
    if (isSelected) {
      // Deselect hook
      onHookSelect(hookId)
    } else {
      // Select hook (if under limit)
      if (selectedHookIds.length < maxSelection) {
        onHookSelect(hookId)
      }
    }
  }

  const templateHooks = hooks.filter(hook => hook.type === 'template')
  const customHooks = hooks.filter(hook => hook.type === 'custom')

  if (hooks.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 dark:text-gray-400">
          No hooks generated yet. Generate hooks from your content first.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Choose 2 hooks to turn into threads
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Select your favorite hooks to generate full Twitter threads
        </p>
      </div>

      {/* Selection Counter */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-blue-800 dark:text-blue-200 font-medium">
            {selectedHookIds.length} of {maxSelection} hooks selected
          </span>
          <div className="flex space-x-1">
            {Array.from({ length: maxSelection }).map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index < selectedHookIds.length
                    ? 'bg-blue-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Template Hooks Section */}
      {templateHooks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📝 Template-Based Hooks
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templateHooks.map((hook) => (
              <HookCard
                key={hook.id}
                hook={hook}
                isSelected={selectedHookIds.includes(hook.id)}
                onSelect={handleHookSelect}
                disabled={!selectedHookIds.includes(hook.id) && selectedHookIds.length >= maxSelection}
                showTemplateInfo={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Custom Hooks Section */}
      {customHooks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            ✨ Creative Hooks
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customHooks.map((hook) => (
              <HookCard
                key={hook.id}
                hook={hook}
                isSelected={selectedHookIds.includes(hook.id)}
                onSelect={handleHookSelect}
                disabled={!selectedHookIds.includes(hook.id) && selectedHookIds.length >= maxSelection}
                showTemplateInfo={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Generate Button */}
      <div className="flex justify-center pt-6">
        <button
          onClick={onGenerateThreads}
          disabled={!canGenerate}
          className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all ${
            canGenerate
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>Generating Threads...</span>
            </div>
          ) : (
            `Generate Threads (${selectedHookIds.length}/${maxSelection})`
          )}
        </button>
      </div>

      {/* Help Text */}
      {!isSelectionComplete && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          Select {maxSelection - selectedHookIds.length} more hook{maxSelection - selectedHookIds.length !== 1 ? 's' : ''} to generate threads
        </div>
      )}
    </div>
  )
}