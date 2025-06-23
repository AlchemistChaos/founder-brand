'use client'

import { useState, useEffect } from 'react'
import { supabaseClient, type UserContext } from '@/lib/supabase-client'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [personalContext, setPersonalContext] = useState('')
  const [contexts, setContexts] = useState<UserContext[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadContexts()
    }
  }, [isOpen])

  const loadContexts = async () => {
    if (!supabaseClient) {
      console.warn('Supabase not configured')
      return
    }
    
    try {
      const { data, error } = await supabaseClient
        .from('user_contexts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setContexts(data || [])
    } catch (error) {
      console.error('Error loading contexts:', error)
    }
  }

  const saveContext = async () => {
    if (!personalContext.trim() || !supabaseClient) return

    setIsLoading(true)
    try {
      const { error } = await supabaseClient
        .from('user_contexts')
        .insert([{ content: personalContext.trim() }])

      if (error) throw error
      
      setPersonalContext('')
      await loadContexts()
    } catch (error) {
      console.error('Error saving context:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteContext = async (id: string) => {
    if (!supabaseClient) return
    
    try {
      const { error } = await supabaseClient
        .from('user_contexts')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadContexts()
    } catch (error) {
      console.error('Error deleting context:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            ⚙️ Personal Context Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Add Personal Context
            </label>
            <textarea
              value={personalContext}
              onChange={(e) => setPersonalContext(e.target.value)}
              placeholder="Add personal info, bio, background, or context that should be used in thread generation..."
              className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={saveContext}
              disabled={!personalContext.trim() || isLoading}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save Context'}
            </button>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Saved Contexts ({contexts.length})
            </h3>
            {contexts.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No personal contexts saved yet. Add one above to personalize your threads.
              </p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {contexts.map((context) => (
                  <div
                    key={context.id}
                    className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 text-sm text-gray-900 dark:text-white">
                        {context.content.length > 150
                          ? context.content.substring(0, 150) + '...'
                          : context.content}
                      </div>
                      <button
                        onClick={() => deleteContext(context.id!)}
                        className="ml-2 text-red-500 hover:text-red-700 text-sm"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      Added {new Date(context.created_at!).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}