export interface TwitterTemplate {
  id: string;
  title: string;
  summary: string;
  template: string;
  category: string;
}

export type TemplateCategory = 
  | 'Personal Story'
  | 'Curation'
  | 'Educational Breakdown'
  | 'Advice & Life Lessons'
  | 'Social Proof / Spotlight'
  | 'Book-Based'
  | 'Insight & Prediction'
  | 'Meta / Reflection on Writing';

export const TWITTER_TEMPLATES: TwitterTemplate[] = [
  {
    id: "life-lessons",
    title: "Life Lessons",
    summary: "Share important life lessons that changed your perspective.",
    template: `Here are [X] life lessons that completely changed my perspective on [Topic]:

1. [Lesson1]
[Explanation1]

2. [Lesson2]
[Explanation2]

3. [Lesson3]
[Explanation3]

4. [Lesson4]
[Explanation4]

5. [Lesson5]
[Explanation5]

The biggest takeaway: [MainTakeaway]`,
    category: "Advice & Life Lessons"
  },
  {
    id: "learning-journey",
    title: "Learning Journey",
    summary: "Share what you learned from spending time studying a topic.",
    template: `I spent [TimeSpent] learning [Skill] from scratch.

Here's everything I learned distilled into [X] actionable insights:

1. [Insight1]
2. [Insight2]
3. [Insight3]
4. [Insight4]
5. [Insight5]

The most important thing: [KeyTakeaway]

Save this thread if you want to [Outcome].`,
    category: "Educational Breakdown"
  },
  {
    id: "mistakes-learned",
    title: "Mistakes and Lessons",
    summary: "Help others avoid mistakes by sharing your experience.",
    template: `[X] mistakes I made learning [Topic] (so you don't have to):

Mistake 1: [Mistake1]
Why it's wrong: [Explanation1]
What to do instead: [Solution1]

Mistake 2: [Mistake2]
Why it's wrong: [Explanation2]
What to do instead: [Solution2]

Mistake 3: [Mistake3]
Why it's wrong: [Explanation3]
What to do instead: [Solution3]

The bottom line: [MainTakeaway]`,
    category: "Personal Story"
  },
  {
    id: "curated-resources",
    title: "Best Resources",
    summary: "Curate the best resources on a topic.",
    template: `The best resources to learn [Topic] in 2024:

🔥 Essential reads:
• [Resource1] - [Why]
• [Resource2] - [Why]
• [Resource3] - [Why]

🎯 Practical guides:
• [Resource4] - [Why]
• [Resource5] - [Why]

⚡ Advanced stuff:
• [Resource6] - [Why]
• [Resource7] - [Why]

Bookmark this thread for later.`,
    category: "Curation"
  },
  {
    id: "success-analysis",
    title: "Success Analysis",
    summary: "Analyze what makes someone successful in their field.",
    template: `I analyzed [X] successful [Professionals] to understand what makes them different.

Here's what I found:

Pattern 1: [Pattern1]
They all [Behavior1]

Pattern 2: [Pattern2]
Every single one [Behavior2]

Pattern 3: [Pattern3]
Without exception, they [Behavior3]

The secret sauce: [MainInsight]

This is what separates good from great.`,
    category: "Insight & Prediction"
  }
];

// Content analysis functions
export interface ContentAnalysis {
  tone: string;
  hasPersonalStory: boolean;
  hasStatistics: boolean;
  hasQuotes: boolean;
  mainTopics: string[];
  wordCount: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface TemplateMatch {
  template: TwitterTemplate;
  score: number;
  reasons: string[];
}

export function analyzeContent(content: string): ContentAnalysis {
  const wordCount = content.split(' ').length;
  
  // Simple analysis - in production this would be more sophisticated
  const hasPersonalStory = /\b(I|my|me|myself)\b/gi.test(content);
  const hasStatistics = /\b\d+%|\b\d+\s+(percent|times|years|months|days)\b/gi.test(content);
  const hasQuotes = /"[^"]*"/g.test(content);
  
  // Determine tone
  const positiveWords = /\b(success|great|amazing|wonderful|excellent|best|love|fantastic|awesome|perfect)\b/gi;
  const negativeWords = /\b(fail|failure|mistake|wrong|bad|terrible|awful|hate|worst|problem)\b/gi;
  
  const positiveMatches = (content.match(positiveWords) || []).length;
  const negativeMatches = (content.match(negativeWords) || []).length;
  
  let tone = 'neutral';
  if (positiveMatches > negativeMatches) tone = 'positive';
  if (negativeMatches > positiveMatches) tone = 'negative';
  
  // Extract main topics (simple keyword extraction)
  const topics = [];
  if (/\b(business|startup|entrepreneur|company)\b/gi.test(content)) topics.push('business');
  if (/\b(learn|education|study|skill|knowledge)\b/gi.test(content)) topics.push('learning');
  if (/\b(success|achieve|goal|win|accomplish)\b/gi.test(content)) topics.push('success');
  if (/\b(life|personal|experience|story)\b/gi.test(content)) topics.push('personal');
  if (/\b(mistake|fail|error|wrong)\b/gi.test(content)) topics.push('mistakes');
  if (/\b(advice|tip|help|guide|how)\b/gi.test(content)) topics.push('advice');
  
  return {
    tone,
    hasPersonalStory,
    hasStatistics,
    hasQuotes,
    mainTopics: topics,
    wordCount,
    sentiment: tone as 'positive' | 'negative' | 'neutral'
  };
}

export function getTemplateMatches(content: string, limit: number = 5): TemplateMatch[] {
  const analysis = analyzeContent(content);
  const matches: TemplateMatch[] = [];
  
  for (const template of TWITTER_TEMPLATES) {
    let score = 0;
    const reasons: string[] = [];
    
    // Score based on content analysis
    if (analysis.hasPersonalStory && template.category === 'Personal Story') {
      score += 30;
      reasons.push('Contains personal story elements');
    }
    
    if (analysis.mainTopics.includes('advice') && template.category === 'Advice & Life Lessons') {
      score += 25;
      reasons.push('Contains advice/lessons');
    }
    
    if (analysis.mainTopics.includes('learning') && template.category === 'Educational Breakdown') {
      score += 25;
      reasons.push('Educational content detected');
    }
    
    if (analysis.mainTopics.includes('mistakes') && template.title.toLowerCase().includes('mistake')) {
      score += 20;
      reasons.push('About mistakes and learning');
    }
    
    // Boost for life lessons content
    if (content.toLowerCase().includes('lesson') && template.id === 'life-lessons') {
      score += 35;
      reasons.push('Perfect match for life lessons content');
    }
    
    // General content matching
    const templateKeywords = template.summary.toLowerCase().split(' ');
    const contentLower = content.toLowerCase();
    for (const keyword of templateKeywords) {
      if (contentLower.includes(keyword)) {
        score += 5;
      }
    }
    
    // Ensure minimum score for variety
    if (score < 10) score = Math.random() * 20 + 10;
    
    matches.push({
      template,
      score: Math.min(100, score),
      reasons
    });
  }
  
  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function extractPlaceholderData(content: string, template: string): Record<string, string> {
  const placeholders: Record<string, string> = {};
  
  // Extract placeholders from template
  const placeholderRegex = /\[([^\]]+)\]/g;
  const matches = template.match(placeholderRegex) || [];
  
  for (const match of matches) {
    const placeholder = match.slice(1, -1); // Remove brackets
    
    // Simple extraction logic - in production this would be more sophisticated
    switch (placeholder.toLowerCase()) {
      case 'x':
        placeholders[placeholder] = '5'; // Default number
        break;
      case 'topic':
        placeholders[placeholder] = 'success';
        break;
      case 'skill':
        placeholders[placeholder] = extractSkillFromContent(content);
        break;
      case 'timespent':
        placeholders[placeholder] = extractTimeFromContent(content);
        break;
      default:
        placeholders[placeholder] = `[${placeholder}]`; // Keep as placeholder
    }
  }
  
  return placeholders;
}

function extractSkillFromContent(content: string): string {
  const skillPattern = /learn(?:ing)?\s+([a-zA-Z\s]+?)(?:\s|$|\.|,)/gi;
  const match = skillPattern.exec(content);
  return match ? match[1].trim() : 'new skill';
}

function extractTimeFromContent(content: string): string {
  const timePattern = /(\d+)\s+(hours?|days?|weeks?|months?|years?)/gi;
  const match = timePattern.exec(content);
  return match ? `${match[1]} ${match[2]}` : '100 hours';
}