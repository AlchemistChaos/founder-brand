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
  const [toneExamples, setToneExamples] = useState<UserContext[]>([])
  const [globalRules, setGlobalRules] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFileUploading, setIsFileUploading] = useState(false)
  const [isToneUploading, setIsToneUploading] = useState(false)
  const [isRulesLoading, setIsRulesLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadContexts()
      loadToneExamples()
      loadGlobalRules() // This will handle localStorage fallback automatically
    }
  }, [isOpen])

  // Load from localStorage (called as fallback or primary)
  const loadLocalGlobalRules = () => {
    try {
      const localRules = localStorage.getItem('globalRules')
      if (localRules) {
        console.log('✅ Loaded global rules from localStorage:', localRules.substring(0, 50) + (localRules.length > 50 ? '...' : ''))
        setGlobalRules(localRules)
      } else {
        console.log('📝 No global rules found in localStorage')
        setGlobalRules('')
      }
    } catch (error) {
      console.warn('❌ Could not load from localStorage:', error)
      setGlobalRules('')
    }
  }

  const saveLocalGlobalRules = () => {
    try {
      if (globalRules.trim()) {
        localStorage.setItem('globalRules', globalRules.trim())
      } else {
        localStorage.removeItem('globalRules')
      }
      alert('Global rules saved locally! (Using browser storage)')
    } catch (error) {
      console.error('Could not save to localStorage:', error)
      alert('Failed to save global rules - localStorage not available')
    }
  }

  const loadContexts = async () => {
    if (!supabaseClient) {
      console.warn('Supabase not configured')
      return
    }
    
    try {
      const { data, error } = await supabaseClient
        .from('user_contexts')
        .select('*')
        .not('content', 'like', 'GLOBAL_RULES:%')
        .not('content', 'like', 'TONE_EXAMPLE:%')
        .order('created_at', { ascending: false })

      if (error) {
        console.warn('Could not load contexts (table may not exist):', error.message || error)
        setContexts([])
        return
      }
      setContexts(data || [])
    } catch (error) {
      console.error('Error loading contexts:', error instanceof Error ? error.message : 'Unknown error')
      setContexts([])
    }
  }

  const loadToneExamples = async () => {
    if (!supabaseClient) {
      console.warn('Supabase not configured')
      return
    }
    
    try {
      const { data, error } = await supabaseClient
        .from('user_contexts')
        .select('*')
        .like('content', 'TONE_EXAMPLE:%')
        .order('created_at', { ascending: false })

      if (error) {
        console.warn('Could not load tone examples (table may not exist):', error.message || error)
        setToneExamples([])
        return
      }
      setToneExamples(data || [])
    } catch (error) {
      console.error('Error loading tone examples:', error instanceof Error ? error.message : 'Unknown error')
      setToneExamples([])
    }
  }

  const saveContext = async () => {
    if (!personalContext.trim() || !supabaseClient) {
      if (!supabaseClient) {
        alert('Supabase not configured. Cannot save personal context.')
      }
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabaseClient
        .from('user_contexts')
        .insert([{ content: personalContext.trim() }])

      if (error) {
        throw new Error(error.message || 'Failed to save personal context')
      }
      
      setPersonalContext('')
      await loadContexts()
      alert('Personal context saved successfully!')
    } catch (error) {
      console.error('Error saving context:', error instanceof Error ? error.message : 'Unknown error')
      alert(`Failed to save context: ${error instanceof Error ? error.message : 'Unknown error'}`)
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

  const deleteToneExample = async (id: string) => {
    if (!supabaseClient) return
    
    try {
      const { error } = await supabaseClient
        .from('user_contexts')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadToneExamples()
    } catch (error) {
      console.error('Error deleting tone example:', error)
    }
  }

  const loadGlobalRules = async () => {
    // Try Supabase first if available
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
          setGlobalRules(data.content.replace('GLOBAL_RULES:', ''))
          console.log('✅ Loaded global rules from Supabase')
          return // Successfully loaded from Supabase
        }
        
        if (error && error.code === 'PGRST116') {
          // No rows found in Supabase, check localStorage
          console.log('📋 No rules in Supabase, checking localStorage...')
        } else if (error) {
          console.warn('⚠️ Supabase error, falling back to localStorage:', error.message || error)
        }
      } catch (error) {
        console.warn('❌ Supabase failed, trying localStorage:', error)
      }
    } else {
      console.log('🔧 Supabase not configured, using localStorage')
    }
    
    // Fallback to localStorage (either no Supabase or Supabase failed)
    loadLocalGlobalRules()
  }

  const saveGlobalRules = async () => {
    if (!supabaseClient) {
      // Fallback to localStorage if Supabase not available
      saveLocalGlobalRules()
      return
    }

    setIsRulesLoading(true)
    try {
      console.log('🔄 Starting global rules save to Supabase...')
      
      // Delete existing global rules
      console.log('🗑️ Deleting existing global rules...')
      const { error: deleteError } = await supabaseClient
        .from('user_contexts')
        .delete()
        .like('content', 'GLOBAL_RULES:%')

      if (deleteError && deleteError.code !== 'PGRST116') {
        console.error('❌ Delete failed:', deleteError)
        console.error('Delete error code:', deleteError.code)
        console.error('Delete error message:', deleteError.message)
        // If table doesn't exist, fall back to localStorage
        if (deleteError.code === '42P01' || deleteError.message?.includes('does not exist')) {
          console.warn('Table does not exist, falling back to localStorage')
          saveLocalGlobalRules()
          return
        }
      } else {
        console.log('✅ Delete operation completed (or no rows to delete)')
      }

      // Insert new global rules if not empty
      if (globalRules.trim()) {
        console.log('📝 Inserting new global rules...')
        const { error: insertError, data: insertData } = await supabaseClient
          .from('user_contexts')
          .insert([{ content: `GLOBAL_RULES:${globalRules.trim()}` }])
          .select()

        if (insertError) {
          console.error('❌ Insert failed:', insertError)
          console.error('Insert error code:', insertError.code)
          console.error('Insert error message:', insertError.message)
          console.error('Insert error hint:', insertError.hint)
          // If table doesn't exist or insert fails, fall back to localStorage
          if (insertError.code === '42P01' || insertError.message?.includes('does not exist') || insertError.code === '23502') {
            console.warn('Falling back to localStorage due to Supabase error')
            saveLocalGlobalRules()
            return
          }
          throw new Error(insertError.message || 'Failed to save global rules')
        } else {
          console.log('✅ Insert successful:', insertData)
        }
      }
      
      await loadContexts()
      console.log('🎉 Global rules saved to Supabase successfully!')
      alert('Global rules saved successfully!')
    } catch (error) {
      console.error('💥 Error saving global rules, falling back to localStorage:', error)
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
      // Final fallback to localStorage
      saveLocalGlobalRules()
    } finally {
      setIsRulesLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsFileUploading(true)
    try {
      const text = await file.text()
      
      // Create context from file content
      const contextContent = `File: ${file.name}\n\n${text}`
      
      if (supabaseClient) {
        const { error } = await supabaseClient
          .from('user_contexts')
          .insert([{ content: contextContent }])

        if (error) throw error
        await loadContexts()
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Failed to upload file. Please try again.')
    } finally {
      setIsFileUploading(false)
      // Reset file input
      event.target.value = ''
    }
  }

  const handleToneFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    setIsToneUploading(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const text = await file.text()
        const toneContent = `TONE_EXAMPLE:${file.name}\n\n${text}`
        
        if (supabaseClient) {
          return supabaseClient
            .from('user_contexts')
            .insert([{ content: toneContent }])
        }
        return null
      })

      const results = await Promise.all(uploadPromises)
      const successful = results.filter(result => result && !result.error)
      
      await loadToneExamples()
      alert(`Successfully uploaded ${successful.length} of ${files.length} tone examples!`)
    } catch (error) {
      console.error('Error uploading tone files:', error)
      alert('Failed to upload some tone examples. Please try again.')
    } finally {
      setIsToneUploading(false)
      // Reset file input
      event.target.value = ''
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
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-purple-900 dark:text-purple-100">
                🎨 Tone & Style Examples ({toneExamples.length})
              </h3>
              {toneExamples.length > 0 && (
                <button
                  onClick={async () => {
                    if (confirm('Delete all tone examples?')) {
                      try {
                        await Promise.all(toneExamples.map(example => deleteToneExample(example.id!)))
                        alert('All tone examples deleted!')
                      } catch (error) {
                        alert('Failed to delete some examples')
                      }
                    }
                  }}
                  className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  Clear All
                </button>
              )}
            </div>
            
            <p className="text-sm text-purple-700 dark:text-purple-300 mb-4">
              Upload your writing samples (.md files work great!). The AI will learn your tone, voice, and writing patterns. Perfect for weekly content updates.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                📄 Upload Style Examples (Multiple Files Supported)
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="file"
                  accept=".txt,.md,.json,.csv"
                  onChange={handleToneFileUpload}
                  disabled={isToneUploading}
                  multiple
                  className="block w-full text-sm text-purple-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 dark:file:bg-purple-800 dark:file:text-purple-200"
                />
                {isToneUploading && (
                  <div className="text-purple-600 text-sm">Uploading...</div>
                )}
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                💡 Select multiple files at once! Perfect for uploading your .md content files. No limit on quantity.
              </p>
            </div>

            {toneExamples.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Your Style Examples:
                </h4>
                {toneExamples.map((example) => {
                  const fileName = example.content.split('\n')[0].replace('TONE_EXAMPLE:', '')
                  const preview = example.content.split('\n\n')[1]?.substring(0, 100) + '...'
                  
                  return (
                    <div
                      key={example.id}
                      className="p-3 border border-purple-200 dark:border-purple-600 rounded-lg bg-purple-25 dark:bg-purple-800/30"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-purple-900 dark:text-purple-100">
                            📄 {fileName}
                          </div>
                          <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                            {preview}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteToneExample(example.id!)}
                          className="ml-2 text-red-500 hover:text-red-700 text-sm"
                        >
                          🗑️
                        </button>
                      </div>
                      <div className="text-xs text-purple-500 dark:text-purple-400 mt-2">
                        Added {new Date(example.created_at!).toLocaleDateString()}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {toneExamples.length === 0 && (
              <div className="text-center py-4 text-purple-600 dark:text-purple-400 text-sm">
                No tone examples uploaded yet. Add some to improve AI style matching!
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              🚫 Global Generation Rules (Always Applied)
            </label>
            <textarea
              value={globalRules}
              onChange={(e) => setGlobalRules(e.target.value)}
              placeholder="Add rules that should ALWAYS be followed, e.g.:
- Never use hashtags
- Never use emojis  
- Always use professional tone
- Keep tweets under 240 characters
- Avoid exclamation marks"
              className="w-full h-32 p-3 border border-red-300 dark:border-red-600 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={saveGlobalRules}
              disabled={isRulesLoading}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRulesLoading ? 'Saving...' : 'Save Global Rules'}
            </button>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              These rules will be applied to ALL thread and hook generation
            </p>
            {!supabaseClient && (
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                ⚠️ Using local storage (Supabase not configured)
              </p>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
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

          <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              📁 Upload File as Context
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="file"
                accept=".txt,.md,.json,.csv"
                onChange={handleFileUpload}
                disabled={isFileUploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200"
              />
              {isFileUploading && (
                <div className="text-blue-600 text-sm">Uploading...</div>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Supported formats: .txt, .md, .json, .csv (max 10MB)
            </p>
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