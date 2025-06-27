'use client'

import { Hook } from '@/lib/types'

interface HookCardProps {
  hook: Hook
  isSelected: boolean
  onSelect: (hookId: string) => void
  disabled?: boolean
  showTemplateInfo?: boolean
}

export default function HookCard({
  hook,
  isSelected,
  onSelect,
  disabled = false,
  showTemplateInfo = true
}: HookCardProps) {
  const handleClick = () => {
    if (!disabled) {
      onSelect(hook.id)
    }
  }

  const getCategoryColor = (category?: string) => {
    if (!category) return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    
    const colors: Record<string, string> = {
      'Personal Story': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Curation': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Educational Breakdown': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Advice & Life Lessons': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'Social Proof / Spotlight': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'Book-Based': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      'Insight & Prediction': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'Meta / Reflection on Writing': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200'
    }
    
    return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }

  const getTypeIcon = (type: string) => {
    return type === 'custom' ? '✨' : '📝'
  }

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
  }

  return (
    <div
      onClick={handleClick}
      className={`group relative p-4 rounded-lg border-2 transition-all cursor-pointer ${
        disabled
          ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700'
          : isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
          : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-400 hover:shadow-md'
      }`}
    >
      {/* Selection Indicator */}
      <div className="absolute top-3 right-3">
        <div
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
            isSelected
              ? 'bg-blue-500 border-blue-500 text-white'
              : 'border-gray-300 dark:border-gray-500 group-hover:border-blue-400'
          }`}
        >
          {isSelected && (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Hook Type & Variation */}
      <div className="flex items-center space-x-2 mb-3">
        <span className="text-lg">{getTypeIcon(hook.type)}</span>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {hook.type === 'custom' ? 'Creative' : 'Template'} • Variation {hook.variation}
        </span>
        {hook.score && (
          <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded">
            {Math.round(hook.score)}% match
          </span>
        )}
      </div>

      {/* Template Info */}
      {showTemplateInfo && hook.templateTitle && hook.templateCategory && (
        <div className="mb-3">
          <div className="flex items-center space-x-2">
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryColor(hook.templateCategory)}`}
            >
              {hook.templateCategory}
            </span>
          </div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">
            {hook.templateTitle}
          </div>
        </div>
      )}

      {/* Hook Text */}
      <div className="text-gray-900 dark:text-white">
        <p className="text-sm leading-relaxed">
          {truncateText(hook.text)}
        </p>
      </div>

      {/* Hover Expansion */}
      {hook.text.length > 150 && (
        <div className="absolute inset-0 p-4 bg-white dark:bg-gray-800 border-2 border-blue-500 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
          <div className="h-full overflow-y-auto">
            {/* Same header content */}
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-lg">{getTypeIcon(hook.type)}</span>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {hook.type === 'custom' ? 'Creative' : 'Template'} • Variation {hook.variation}
              </span>
            </div>
            
            {/* Full text */}
            <div className="text-gray-900 dark:text-white">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {hook.text}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Selection Animation */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-blue-500 rounded-lg animate-pulse pointer-events-none" />
      )}
    </div>
  )
}