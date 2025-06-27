#!/usr/bin/env node

/**
 * AI-Powered Tone Profile Generator
 * 
 * This script uses AI to analyze your uploaded tone examples and create
 * a comprehensive tonal.md file that captures your writing style.
 */

const { createClient } = require('@supabase/supabase-js')
const OpenAI = require('openai')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const openaiKey = process.env.OPENAI_API_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

if (!openaiKey) {
  console.error('❌ Missing OpenAI API key in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const openai = new OpenAI({ apiKey: openaiKey })

async function getToneExamples() {
  console.log('📚 Fetching tone examples from database...')
  
  const { data, error } = await supabase
    .from('user_contexts')
    .select('content')
    .like('content', 'TONE_EXAMPLE:%')
    .order('created_at', { ascending: false })

  if (error || !data || data.length === 0) {
    console.error('❌ No tone examples found in database')
    process.exit(1)
  }

  // Extract the actual content and take first 1000 chars of each for analysis
  const examples = data.map(example => {
    const lines = example.content.split('\n')
    const filename = lines[0].replace('TONE_EXAMPLE:', '')
    const content = lines.slice(2).join('\n').trim()
    
    // Take first 1000 characters for style analysis (enough to capture tone)
    const truncatedContent = content.length > 1000 
      ? content.substring(0, 1000) + '...'
      : content
      
    return { filename, content: truncatedContent }
  }).slice(0, 10) // Use max 10 examples

  console.log(`✅ Found ${data.length} tone examples, analyzing top ${examples.length}`)
  return examples
}

async function generateToneProfile(examples) {
  console.log('🤖 Analyzing writing style with AI...')
  
  const analysisPrompt = `You are an expert writing analyst. Analyze these writing samples to create a comprehensive tone and style profile.

WRITING SAMPLES (${examples.length} examples):
${examples.map((ex, i) => `\n--- Sample ${i + 1} ---\n${ex.content}`).join('\n')}

Create a detailed tone profile that captures:

1. **VOICE & PERSONALITY**
   - Overall tone and personality
   - Emotional range and approach

2. **OPENING PATTERNS** 
   - How posts typically start
   - Hook techniques used

3. **VOCABULARY & LANGUAGE**
   - Key phrases used repeatedly
   - Language style and formality level
   - Technical vs. everyday language

4. **ENGAGEMENT TECHNIQUES**
   - How the writer hooks readers
   - Use of controversy, facts, or personal elements
   - Persuasion methods

5. **SENTENCE STRUCTURE**
   - Typical sentence patterns
   - Paragraph organization
   - Flow and transitions

Provide specific examples from the text. Make this profile detailed enough that an AI could convincingly write in this exact style.

Format as clear markdown.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use smaller model to avoid rate limits
      messages: [{ role: 'user', content: analysisPrompt }],
      temperature: 0.2,
      max_tokens: 1500,
    })

    return completion.choices[0]?.message?.content || ''
  } catch (error) {
    console.error('❌ Error analyzing with AI:', error.message)
    process.exit(1)
  }
}

async function saveToneProfile(profile) {
  const outputPath = path.join(process.cwd(), 'src', 'data', 'tonal.md')
  
  // Ensure directory exists
  const dir = path.dirname(outputPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  // Add header with generation info
  const finalProfile = `# Writing Style & Tone Profile

> Generated on ${new Date().toISOString()}
> This profile is automatically used in all content generation

${profile}

---

*This profile is automatically applied to all hook generation, thread creation, and tweet rewrites to maintain consistent voice and style.*
`

  fs.writeFileSync(outputPath, finalProfile, 'utf8')
  console.log(`✅ Tone profile saved to: ${outputPath}`)
}

async function main() {
  console.log('🎨 AI-Powered Tone Profile Generator\n')
  
  try {
    const examples = await getToneExamples()
    const profile = await generateToneProfile(examples)
    await saveToneProfile(profile)
    
    console.log(`
🎉 SUCCESS! Your tone profile is ready!

The AI analyzed your ${examples.length} writing samples and created a comprehensive style guide.
This will now be automatically used in all content generation to match your voice.

Next steps:
1. Review the generated profile at src/data/tonal.md
2. Test content generation - it should now sound much more like your style!
3. Re-run this script whenever you upload new tone examples

`)
  } catch (error) {
    console.error('💥 Error:', error.message)
    process.exit(1)
  }
}

main() 