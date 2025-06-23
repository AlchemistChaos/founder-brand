'use client'

const THREAD_TYPES = [
  { id: 'summary', label: '📄 Summary', description: 'Key points overview' },
  { id: 'listicle', label: '📝 Listicle', description: 'Numbered insights' },
  { id: 'myth-busting', label: '🔍 Myth-busting', description: 'Debunk misconceptions' },
  { id: 'inspirational', label: '✨ Inspirational', description: 'Motivational takeaways' },
  { id: 'narrative', label: '📖 Narrative', description: 'Story-driven thread' },
  { id: 'qa', label: '❓ Q&A', description: 'Question & answer format' },
  { id: 'controversial', label: '🔥 Hot Take', description: 'Controversial opinion' },
  { id: 'teardown', label: '🔬 Analysis', description: 'Deep dive teardown' },
  { id: 'idea', label: '💡 Ideas', description: 'Creative concepts' },
  { id: 'curated', label: '🎯 Curated', description: 'Best insights compilation' },
]

interface ThreadTypeSelectorProps {
  selectedType: string
  onTypeChange: (type: string) => void
}

export default function ThreadTypeSelector({ 
  selectedType, 
  onTypeChange 
}: ThreadTypeSelectorProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        🧵 Thread Format
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {THREAD_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => onTypeChange(type.id)}
            className={`p-3 rounded-lg border text-left transition-all ${
              selectedType === type.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
            }`}
          >
            <div className="font-medium text-sm">{type.label}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {type.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}