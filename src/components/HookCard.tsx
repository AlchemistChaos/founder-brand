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
      // Template Categories
      'Personal Story': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Curation': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Educational Breakdown': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Advice & Life Lessons': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'Social Proof / Spotlight': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'Book-Based': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      'Insight & Prediction': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'Meta / Reflection on Writing': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
      
      // Power Hook Categories (vibrant colors for viral potential)
      'Myth Busting': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'Controversial': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'Hidden Value': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      'Transformation': 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
      'Authority/Secrets': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      'Harsh Truth': 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
      'Achievement Path': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
      'Elite Insights': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      'Anti-Guru': 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
      'Regret/Wisdom': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Unbelievable Truth': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'Mistake Warning': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'Alternative Strategy': 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
      'Correction': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Priority Correction': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
      'Mind Shift': 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-200',
      'Behavior Change': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Fresh Start': 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200',
      'Hidden Knowledge': 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200',
      'Limiting Belief': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'Success Secrets': 'bg-gold-100 text-gold-800 dark:bg-gold-900 dark:text-gold-200',
      'Dangerous Truth': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'Social Conditioning': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      'Simple Success': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    }
    
    return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }

  const getTypeIcon = (type: string) => {
    if (type === 'custom') return '✨'
    if (type === 'power-hook') return '🔥'
    return '📝'
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
          {hook.type === 'custom' ? 'Creative' : hook.type === 'power-hook' ? 'Power Hook' : 'Template'} • Variation {hook.variation}
        </span>
        {hook.score && (
          <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded">
            {Math.round(hook.score)}% match
          </span>
        )}
      </div>

      {/* Template/Power Hook Info */}
      {showTemplateInfo && (
        <div className="mb-3">
          {/* Power Hook Info */}
          {hook.type === 'power-hook' && hook.powerHookCategory && (
            <div className="flex items-center space-x-2">
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryColor(hook.powerHookCategory)}`}
              >
                {hook.powerHookCategory}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Viral Potential
              </span>
            </div>
          )}
          
          {/* Template Info */}
          {hook.type === 'template' && hook.templateTitle && hook.templateCategory && (
            <>
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
            </>
          )}
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
                {hook.type === 'custom' ? 'Creative' : hook.type === 'power-hook' ? 'Power Hook' : 'Template'} • Variation {hook.variation}
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