import { PowerHook } from './types'

// Server-side only functions that use Node.js APIs
// These should only be imported in API routes, not client components

// Helper function to get user's tone profile (server-side only)
export async function getToneExamples(): Promise<string> {
  try {
    // Server side - read the AI-generated tone profile
    const fs = require('fs')
    const path = require('path')
    
    const tonalPath = path.join(process.cwd(), 'src', 'data', 'tonal.md')
    
    if (fs.existsSync(tonalPath)) {
      const toneProfile = fs.readFileSync(tonalPath, 'utf8')
      return toneProfile
    }
    
    // Fallback: If no tonal.md file exists, return empty
    return ''
  } catch (error) {
    console.error('Error reading tone profile:', error)
    return ''
  }
}

// Helper function to load power hooks (server-side only)
export async function getPowerHooks(): Promise<PowerHook[]> {
  try {
    // Server side - read power hooks
    const fs = require('fs')
    const path = require('path')
    
    const powerHooksPath = path.join(process.cwd(), 'power-hooks.json')
    
    if (fs.existsSync(powerHooksPath)) {
      const powerHooksData = fs.readFileSync(powerHooksPath, 'utf8')
      return JSON.parse(powerHooksData) as PowerHook[]
    }
    
    // Fallback: If no power-hooks.json file exists, return empty array
    return []
  } catch (error) {
    console.error('Error reading power hooks:', error)
    return []
  }
} 