#!/usr/bin/env node

/**
 * Bulk Tone Examples Uploader
 * 
 * Usage:
 *   node scripts/upload-tone-examples.js path/to/your/md/files/
 *   node scripts/upload-tone-examples.js path/to/your/md/files/ --clear  (clears existing first)
 * 
 * This script uploads all .md files in a directory as tone examples
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function clearExistingToneExamples() {
  console.log('🗑️  Clearing existing tone examples...')
  
  const { error } = await supabase
    .from('user_contexts')
    .delete()
    .like('content', 'TONE_EXAMPLE:%')

  if (error) {
    console.error('❌ Failed to clear existing tone examples:', error.message)
    return false
  }
  
  console.log('✅ Cleared existing tone examples')
  return true
}

async function uploadToneExample(filePath) {
  try {
    const fileName = path.basename(filePath)
    let content = fs.readFileSync(filePath, 'utf8')
    
    // Handle large files - truncate if needed to fit database limits
    // Supabase has a limit around 2700 characters for indexed content
    const maxContentLength = 2000 // Conservative limit to avoid index issues
    
    if (content.length > maxContentLength) {
      console.log(`📏 File ${fileName} is ${content.length} chars, truncating to ${maxContentLength}...`)
      // Take the first part of the content to preserve the writing style
      content = content.substring(0, maxContentLength) + '\n\n[Content truncated for database storage]'
    }
    
    const toneContent = `TONE_EXAMPLE:${fileName}\n\n${content}`
    
    const { error } = await supabase
      .from('user_contexts')
      .insert([{ content: toneContent }])
    
    if (error) {
      console.error(`❌ Failed to upload ${fileName}:`, error.message)
      return false
    }
    
    console.log(`✅ Uploaded ${fileName}`)
    return true
  } catch (error) {
    console.error(`❌ Error reading ${filePath}:`, error.message)
    return false
  }
}

async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.log(`
🎨 Bulk Tone Examples Uploader

Usage:
  node scripts/upload-tone-examples.js <directory>
  node scripts/upload-tone-examples.js <directory> --clear

Examples:
  node scripts/upload-tone-examples.js ./my-content/
  node scripts/upload-tone-examples.js /path/to/md/files --clear

Options:
  --clear    Clear existing tone examples before uploading
    `)
    process.exit(0)
  }
  
  const directoryPath = args[0]
  const shouldClear = args.includes('--clear')
  
  if (!fs.existsSync(directoryPath)) {
    console.error(`❌ Directory not found: ${directoryPath}`)
    process.exit(1)
  }
  
  if (!fs.statSync(directoryPath).isDirectory()) {
    console.error(`❌ Not a directory: ${directoryPath}`)
    process.exit(1)
  }
  
  // Clear existing if requested
  if (shouldClear) {
    const cleared = await clearExistingToneExamples()
    if (!cleared) {
      process.exit(1)
    }
  }
  
  // Find all .md files
  const files = fs.readdirSync(directoryPath)
    .filter(file => file.toLowerCase().endsWith('.md'))
    .map(file => path.join(directoryPath, file))
  
  if (files.length === 0) {
    console.log(`📁 No .md files found in ${directoryPath}`)
    process.exit(0)
  }
  
  console.log(`📚 Found ${files.length} .md files`)
  console.log('🚀 Starting upload...\n')
  
  let successful = 0
  let failed = 0
  
  for (const file of files) {
    const success = await uploadToneExample(file)
    if (success) {
      successful++
    } else {
      failed++
    }
  }
  
  console.log(`
📊 Upload Summary:
✅ Successful: ${successful}
❌ Failed: ${failed}
📁 Total: ${files.length}

${successful > 0 ? '🎉 Your tone examples are now ready! The AI will use these to match your writing style.' : ''}
  `)
}

main().catch(console.error) 