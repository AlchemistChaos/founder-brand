// 100 Unique Twitter Thread Hooks
export const TWITTER_HOOKS = [
  "Here's the truth no one's telling you about",
  "I've been studying [topic] for [time] and discovered",
  "Everyone thinks [common belief], but here's what actually happens:",
  "The [industry/field] doesn't want you to know this:",
  "After [experience/research], I learned something shocking:",
  "Most people get [topic] completely wrong. Here's why:",
  "This changed everything I thought I knew about",
  "The data reveals something surprising about",
  "I used to believe [common belief] until I discovered",
  "If you only learn one thing about [topic], make it this:",
  "The uncomfortable truth about [topic] that nobody talks about:",
  "Why [popular opinion] is dead wrong (and what to do instead):",
  "The [number] secrets [industry] professionals don't want you to know:",
  "What [successful person/company] won't tell you about [topic]:",
  "The hidden cost of [common practice] that's destroying [outcome]:",
  "Why doing [common advice] is actually making things worse:",
  "The [number] mistakes I made so you don't have to:",
  "What [number] years of [experience] taught me about [topic]:",
  "The brutal reality of [topic] that no one prepares you for:",
  "How [unexpected method] completely changed my approach to [topic]:",
  "The [number] signs you're doing [activity] wrong:",
  "What happened when I [extreme action] for [time period]:",
  "The [adjective] truth about [topic] that [group] hope you never discover:",
  "Why [conventional wisdom] is keeping you stuck:",
  "The [number] lies we tell ourselves about [topic]:",
  "What [number] failed attempts taught me about [topic]:",
  "The psychology behind why [behavior] never works:",
  "How [small change] led to [big result] in just [timeframe]:",
  "The [number] questions that will change how you think about [topic]:",
  "What [expert/mentor] told me that completely shifted my perspective:",
  "The hidden pattern in [successful examples] that no one talks about:",
  "Why [popular strategy] worked 10 years ago but fails today:",
  "The [number] red flags of [bad situation] everyone ignores:",
  "What studying [number] [examples] revealed about [topic]:",
  "The counterintuitive approach to [goal] that actually works:",
  "Why [common fear] is actually your biggest opportunity:",
  "The [number] stages of [process] and what to expect at each:",
  "How [constraint] became my greatest advantage in [area]:",
  "What [failure] taught me about [success principle]:",
  "The [number] myths about [topic] that are holding you back:",
  "Why [obvious solution] makes the problem worse:",
  "The simple framework that transformed my [area of life]:",
  "What [number] years in [field] taught me about human nature:",
  "The [number] words that changed everything I believed about [topic]:",
  "Why [popular advice] only works for [specific group]:",
  "The hidden connection between [topic A] and [topic B]:",
  "What [dramatic event] revealed about [deeper truth]:",
  "The [number] principles that govern [complex topic]:",
  "Why [current trend] is a symptom of [bigger problem]:",
  "The uncomfortable conversation we need to have about [topic]:",
  "What [number] experiments taught me about [hypothesis]:",
  "The [number] cognitive biases destroying your [goal]:",
  "Why [standard approach] creates the opposite of what you want:",
  "The hidden economics of [industry/situation] explained:",
  "What [crisis/challenge] taught an entire generation about [lesson]:",
  "The [number] phases of [transformation] and how to navigate each:",
  "Why [obvious metric] is the wrong thing to measure:",
  "The psychological trap that keeps [group] stuck in [situation]:",
  "What [number] conversations with [type of person] revealed:",
  "The [number] forces shaping the future of [industry/topic]:",
  "Why [traditional method] was designed for a world that no longer exists:",
  "The hidden story behind [success/failure] that changes everything:",
  "What [natural phenomenon] teaches us about [human behavior]:",
  "The [number] assumptions about [topic] that data proves wrong:",
  "Why [common goal] might be the wrong thing to pursue:",
  "The evolutionary reason why [behavior] feels so difficult:",
  "What [number] years of [data/research] reveals about [trend]:",
  "The [number] questions successful [professionals] ask daily:",
  "Why [popular tool/method] works for some but fails for others:",
  "The hidden complexity behind [seemingly simple concept]:",
  "What [historical event] teaches us about [current situation]:",
  "The [number] mental models that changed how I see [topic]:",
  "Why [surface-level solution] never addresses [root cause]:",
  "The paradox of [concept] that most people miss:",
  "What [number] failed [projects/attempts] taught me about [success]:",
  "The [number] warning signs of [negative outcome] to watch for:",
  "Why [conventional wisdom] leads to [predictable failure]:",
  "The compound effect of [small action] over [time period]:",
  "What [extreme example] reveals about [normal situation]:",
  "The [number] filters I use to evaluate [decisions/opportunities]:",
  "Why [popular belief] is actually [opposite] in disguise:",
  "The hidden curriculum of [field/industry] they don't teach:",
  "What [number] generations learned about [topic] the hard way:",
  "The [number] levels of [skill/understanding] and where you are:",
  "Why [obvious solution] treats symptoms instead of causes:",
  "The mathematical reality of [concept] that changes everything:",
  "What [cross-industry insight] taught me about [specific field]:",
  "The [number] emotional stages of [challenging process]:",
  "Why [mainstream approach] optimizes for [wrong outcome]:",
  "The invisible forces that determine [result] before you even start:",
  "What [number] case studies reveal about [pattern/principle]:",
  "The [number] systems that run [complex situation] behind the scenes:",
  "Why [current best practice] will be obsolete in [timeframe]:",
  "The emergence of [new reality] and what it means for [audience]:",
  "What [simulation/thought experiment] teaches about [real scenario]:",
  "The [number] feedback loops that either accelerate or destroy [progress]:",
  "Why [popular metric] measures [wrong thing] entirely:",
  "The ancient wisdom about [topic] that modern [field] forgot:",
  "What [number] outliers taught me about [normal distribution]:",
  "The [number] dimensions of [complex topic] most people ignore:",
  "Why [incremental improvement] is sometimes worse than [status quo]:",
  "The network effects of [behavior] that compound over time:",
  "What [interdisciplinary approach] reveals about [specialized field]:",
  "The [number] trade-offs in [decision] that no one talks about:",
  "Why [optimization] in [area A] often destroys [area B]:",
  "The emergent properties of [system] that can't be predicted:",
  "What [number] years of [practice] taught me about [mastery]:"
]

// Function to get random hooks for variety
export function getRandomHooks(count: number = 10): string[] {
  const shuffled = [...TWITTER_HOOKS].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

// Function to get hooks relevant to content (basic keyword matching)
export function getRelevantHooks(content: string, count: number = 10): string[] {
  // Simple relevance scoring based on content keywords
  const contentLower = content.toLowerCase()
  const keywords = ['business', 'marketing', 'psychology', 'success', 'strategy', 'data', 'research']
  
  // If content matches certain keywords, prefer relevant hooks
  if (keywords.some(keyword => contentLower.includes(keyword))) {
    const relevantHooks = TWITTER_HOOKS.filter(hook => 
      keywords.some(keyword => hook.toLowerCase().includes(keyword) || 
      hook.includes('[industry]') || hook.includes('[research]') || 
      hook.includes('[data]') || hook.includes('[professional]'))
    )
    
    if (relevantHooks.length >= count) {
      return relevantHooks.slice(0, count)
    }
  }
  
  // Fallback to random selection
  return getRandomHooks(count)
}