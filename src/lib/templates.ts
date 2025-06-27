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
    id: "career-mistakes",
    title: "Career Mistakes",
    summary: "Help readers avoid mistakes by learning from your experiences.",
    template: `I asked [X] [Niche] leaders one simple question:

"What early career mistake will you never make again?"

The result: [X] profound mistakes everyone (from intern to executive) should avoid in their career.

Let's dive in:

Mistake 1: [Mistake1]

Too often, [Role] choose to [WrongDecision].

Instead, [Role] should be focused on [RightDecision].

This is what ends up making the biggest difference.

Mistake 2: [Mistake2]

A good [Role] can [GoodOutcome].

A bad [Role] can [BadOutcome].

But a legendary [Role] can [GiantOutcome].

Mistake 3: [Mistake3]

Until you've [Milestone], don't take your eye off the ball.

["RelevantQuote"].

Mistake 4: [Mistake4]

Traditional wisdom says [TraditionalWisdom].

But that's only true if you don't do two things correctly:

[RightDecision1]

[RightDecision2]

Then, [TraditionalWisdom] works great.

Mistake 5: [Mistake5]

We all think we can [Decision].

Until we can't.

Which is why it's much better to [RightDecision] from the very beginning.`,
    category: "Personal Story"
  },
  {
    "id": "curated-frameworks",
    "title": "Curated Frameworks",
    "summary": "Transform other people's mental models into consumable content.",
    "template": "The world's most valuable skill:\n\n[Skill]\n\nBut [Obstacle] keeps people from ever learning how to do it—and costs them roughly [Money] in the process.\n\nSo, here are [X] [Topic] frameworks that cost you nothing and will save you hundreds of painful hours:\n\n1) [Name]'s [Topic] Framework\n\nThis completely changed the way I thought about [Topic].\n\n[LinkToThread]\n\n2) [Name]'s [Topic] Framework\n\nHang this up in your room somewhere—and stare at it everyday.\n\n[LinkToThread]\n\n3) [Name]'s [Topic] Framework\n\nI consider this the Bible of [Topic].\n\n[LinkToThread]\n\n4) [Name]'s [Topic] Framework\n\nStruggling with [Obstacle]?\n\nRead this:\n\n[LinkToThread]\n\n5) [Name]'s [Topic] Framework\n\nFinally, every [Audience] should read this:\n\n[LinkToThread]",
    "category": "Curation"
  },
  {
    "id": "curated-takeaways",
    "title": "Curated Takeaways",
    "summary": "Crystallize your own learnings by sharing your takeaways with others.",
    "template": "The [Status] of [Topic]:\n\n[Name]\n\nOver [TimePeriod], [Name] has [Achievement].\n\nSo I binged over [X] [Assets] of theirs to study how exactly [Name] reached [Achievement].\n\nHere's what I learned–broken down in a simple [X]-step framework you can use to [Outcome]:\n\nSome quick stats on [Name] if you're unfamiliar:\n\n[AchievementStat1]\n\n[AchievementStat2]\n\n[AchievementStat3]\n\n[AchievementStat4]\n\nSo... what can we learn?\n\n[Name] creates [Assets] with this simple, 3-part framework:\n\n1) [Step1]\n\n2) [Step2]\n\n3) [Step3]\n\nNow, pair this framework with an unmatched work ethic and you get a potent combination for rapid growth.\n\nLet's dig in:\n\nFor [Name], everything begins with [Step1].\n\nThe reason is because [Reason].\n\nTo do this, [Name] does the following:\n\n[Tactic1]\n\n[Tactic2]\n\n[Tactic3]\n\nSimple, but highly effective.\n\nThe next thing [Name] focuses on is [Step2].\n\nThey do this by [Tactic], and sometimes even [Tactic].\n\nWhich leads us to…\n\nThe real reason [Name] is so successful at [Outcome] is because they are obsessive about:\n\n[Tactic]\n\n[Tactic]\n\n[Tactic]\n\nThis, combined with [Step1] and [Step2] is what makes them so successful.\n\nSo, let's recap what we've learned:\n\nFirst, study [Step1].\n\nAnd remember to [DescriptionStep1].\n\nSecond, study the art of [Step2]. Do this by:\n\n1) [Tactic1]\n\n2) [Tactic2]\n\n3) [Tactic3]\n\nAnd lastly, don't [Mistake].\n\nInstead, [Step 3].\n\nAnd don't forget to [DescriptionStep3].\n\nDo the above, and maybe you will be the next [Status] of [Topic]!",
    "category": "Curation"
  },
  {
    "id": "curated-blog-posts",
    "title": "Curated Blog Posts",
    "summary": "Thread Opener: top blog posts you recommend reading.",
    "template": "2.5 billion blog posts are published each year.\n\nBut it's impossible to read that much content.\n\nSo, ignore the 2,499,999,992 that aren't worth your time.\n\nAnd just read these 8:\n\n[Write your thread here]",
    "category": "Curation"
  },
  {
    "id": "curated-tedtalks",
    "title": "Curated TedTalks",
    "summary": "Thread Opener: curate a list of TedTalks that you believe your audience will find useful.",
    "template": "I am an education junkie.\n\nFor example, I have watched over [X] hours watching nearly every TedTalk on the Internet.\n\nMany are interesting. But only a few are worth your time.\n\nHere is a list of my [X] favorites—that will help you [Outcome1], [Outcome2], and [Outcome3]:\n\n[Write your thread here]",
    "category": "Curation"
  },
  {
    "id": "curated-twitter-threads",
    "title": "Curated Twitter Threads",
    "summary": "Thread Opener: best threads for the audience to start learning about your niche.",
    "template": "[FamousPerson] once said:\n\n[RelevantNicheQuote]\n\nLucky for you, [Niche] is a skill anyone can acquire.\n\nUnfortunately, most people never learn it—because no one shows them where to start.\n\nSo here are [X] of the best [Niche] threads (so you can start learning today):\n\n[Write your thread here]",
    "category": "Curation"
  },
  {
    "id": "curated-youtube-channels",
    "title": "Curated YouTube Channels",
    "summary": "Thread Opener: YouTube channels that provide valuable information about a niche.",
    "template": "If Twitter is a free University, then YouTube is a free Graduate Program.\n\nHere are [X] YouTube channels you can follow to become a master of [Niche]—that are so valuable they should charge $100,000+ for the information & insight they provide:\n\n[Write your thread here]",
    "category": "Curation"
  },
  {
    "id": "individual-book-breakdown",
    "title": "Individual Book Breakdown",
    "summary": "Thread Opener: introduce a book that has a simple step-by-step process for a desired outcome.",
    "template": "[BookMainTitle]\n\n[BookSubtitle]\n\nBack in [Year], legendary [StatusTitle] [Author] distilled his/her/their [X] years of wisdom into [X] pages.\n\nAnd in this book, [He/She/They] shared a simple [X]-step process for [Outcome].\n\nHere's the breakdown:\n\n[Write your thread here]",
    "category": "Educational Breakdown"
  },
  {
    "id": "1000-hours",
    "title": "1,000 Hours",
    "summary": "A hook for a thread sharing what you've learned after 1,000 hours of studying a topic.",
    "template": "I spent over 1,000 hours learning to [Skill] effectively— because college completely failed to teach me.\n\nHere's everything I learned distilled into 11 tweets (that you can start applying today):",
    "category": "Advice & Life Lessons"
  },
  {
    "id": "best-book-this-year",
    "title": "Best Book This Year",
    "summary": "Thread hook introducing the best book you've read this year.",
    "template": "The best book I've read this year:\n\n[BookTitle] by [AuthorName].\n\nBuried inside this gem are 4 short pages that pack more insights on [Outcome] than any book I've ever read.\n\nHere are [X] quotes that will change the way you think about [Topic] forever:",
    "category": "Book-Based"
  },
  {
    "id": "college-failed-me",
    "title": "College Failed Me",
    "summary": "Thread hook for the frameworks that helped you learn a skill college failed to teach you.",
    "template": "College completely failed in teaching me how to [Skill].\n\nSo I spent over 500 hours studying legendary [SkillTeachers].\n\nThen, I distilled what I learned into [X] simple frameworks.\n\nBut unlike college, these won't cost you [$X].\n\nHere they are for free:",
    "category": "Educational Breakdown"
  },
  {
    "id": "highest-paid-person-ever",
    "title": "Highest Paid Person Ever",
    "summary": "Thread hook for strategies used by the highest paid person in a specific field.",
    "template": "The highest-paid [SkillPerson] in history: [Name]\n\n[His/Her] legendary [Asset] have generated over [$X] in revenue.\n\nLuckily, in a rare interview in [Year], [He/She] revealed their [X] time-tested strategies for [Outcome].\n\nHere's a breakdown of each one:",
    "category": "Social Proof / Spotlight"
  },
  {
    "id": "iconic-quote-thread-of-threads",
    "title": "Iconic Quote (Thread of Threads)",
    "summary": "A hook for a thread of the best threads about a topic.",
    "template": "[FamousPerson] once said:\n\n"[FamousQuote]"\n\nLuckily, this is a skill anyone can learn.\n\nUnfortunately, most people have never tried—because no one showed them where to start.\n\nSo here are [X] of the best [Topic] threads on Twitter (so you can start learning today):",
    "category": "Social Proof / Spotlight"
  },
  {
    "id": "if-you-use-it-right",
    "title": "If You Use It Right",
    "summary": "Thread hook for uncommonly known features about a specific platform.",
    "template": "If you use it right, [PlatformName] is the most powerful platform in the world.\n\nBut [PlatformName] does a horrible job [Problem].\n\nHere are [X] [Features] you probably don't know exist:",
    "category": "Advice & Life Lessons"
  },
  {
    "id": "successful-company-laws-of-success",
    "title": "Successful Company Laws of Success",
    "summary": "Thread hook: rules for success used by a successful company.",
    "template": "The most [Description] company of the last [X] years:\n\n[Company]\n\nBack in [Date], [Company] shared their manifesto for [Topic].\n\nAnd the rules are a must-read for [Audience1], [Audience2], and anyone who wants to [Outcome].\n\nHere's the breakdown:",
    "category": "Advice & Life Lessons"
  },
  {
    "id": "the-godfather",
    "title": "The Godfather",
    "summary": "Thread hook that introduces the Godfather of an industry.",
    "template": "The Godfather of [Industry]: [Name]\n\nIn [Year], [he/she] published [BookName], a book so good the original [RecordOutcome].\n\nAnd inside, [he/she] shared the [Topic] routine that helped [him/her] [Outcome1] and [Outcome2].\n\nHere's the breakdown:",
    "category": "Social Proof / Spotlight"
  },
  {
    "id": "the-king-of-x-platform",
    "title": "The King of X Platform",
    "summary": "Thread hook for how the King (or Queen) of X platform has grown so quickly.",
    "template": "The KING of [Platform]:\n\n[Name]\n\nOver the last 12 months, [He/She] has gained over [X] subscribers.\n\nSo I binge watched [X] hours of [His/Her] videos to study how [He/She/They] have grown so quickly.\n\nAnd here's [His/Her] [X]-part framework for rapid growth (that you can use on any platform):",
    "category": "Social Proof / Spotlight"
  },
  {
    "id": "the-most-valuable-feature",
    "title": "The Most Valuable Feature",
    "summary": "Thread hook for a guide on how to use a valuable feature from a platform.",
    "template": "The most valuable [Platform] feature you aren't using:\n\n[Feature]\n\nKnowing how to use it will help you [Outcome1] and [Outcome2].\n\nHere's a step-by-step guide on how to use it:",
    "category": "Educational Breakdown"
  },
  {
    "id": "worlds-most-valuable-skill",
    "title": "World's Most Valuable Skill",
    "summary": "Thread hook: share the world's most valuable skill and the frameworks that will help your audience learn it.",
    "template": "The world's most valuable skill:\n\n[Skill]\n\nBut colleges charge you [$X] and still do a terrible job teaching it.\n\nInstead, here are [X] [Skill] frameworks that you cost you nothing and will save you hundreds of hours:",
    "category": "Insight & Prediction"
  },
  {
    "id": "expertise-secrets",
    "title": "Expertise Secrets",
    "summary": "Leverage your unique knowledge to have an impact on your industry.",
    "template": "{Topic} 101\n\nOver the past {X} years, I have {ShortCredibilityStatement}.\n\nWant to know a secret?\n\nI use the same {X}{Technique} every",
    "category": "Educational Breakdown"
  },
  {
    "id": "the-book-curation-thread",
    "title": "The Book Curation Thread",
    "summary": "Create a compilation of books that you think are worth the read.",
    "template": "Over the past X amount of time, I have read X number of [specific genre].\n\n99% of them weren't worth it.\n\nSave yourself the time and just read/listen/follow these X 🧵👇\n\nBook",
    "category": "Curation"
  },
  {
    "id": "credibility-and-lessons",
    "title": "Credibility & Lessons",
    "summary": "Share your secrets to achieving an outcome along with actionable advice for the reader.",
    "template": "Over the past X years, I have [list 3 accomplishments/accolades of credibility].\n\nWhat most people don't know?\n\nI use the same X [approaches, templates, techniques, strategies, etc.] every time.\n\n🧵👇\n\nTemplate #1: One sentence\n\nWhat's the fastest way to achieve X?\n\nDo Y.\n\nSuccess here 100% comes down to:\n\n• Action step\n\n• Action",
    "category": "Advice & Life Lessons"
  },
  {
    "id": "curated-list",
    "title": "Curated List",
    "summary": "Curate a list of tips and lessons from an expert that will benefit the reader in some way.",
    "template": "X person is best known for doing Y.\n\nIn [year / book / speech / etc.], he/she put together a masterclass on X topic.\n\nThese X [ideas / things / tips / lessons / etc.] will change the way you [list 3 benefits to the reader].\n\nHere's a",
    "category": "Curation"
  },
  {
    "id": "if-i-had-to-do-it-over-again-thread",
    "title": "'If I Had To Do It Over Again' Thread",
    "summary": "Things you would do differently to achieve a specific outcome faster.",
    "template": "I started [doing X] when I was [Y years old].\n\nSince then, I've...\n\n• Accomplishment #1\n\n• Accomplishment #2\n\n• Accomplishment #3\n\n• Accomplishment #4\n\nIf I had to do it all over again, here are 5 things I'd do differently.\n\nThing #1: Don't do X.\n\nAt the time, I thought [this] was a good idea.\n\nIt wasn't.\n\nIt led",
    "category": "Personal Story"
  },
  {
    "id": "personal-story-+-advice",
    "title": "Personal Story + Advice",
    "summary": "Use a personal story to give advice on a specific topic.",
    "template": "Mastering X unlocks Y.\n\nUnfortunately, we don't get taught how to do this.\n\nFor the past X years, I have been [explain what makes you a credible source of information on this topic].\n\nHere are X pieces of advice that will help you [restate Y + 2-3 more benefits].\n\n🧵👇\n\nAdvice #1: One sentence.\n\nWhen we're first starting out, we think X",
    "category": "Personal Story"
  },
  {
    "id": "the-framework-thread",
    "title": "The Framework Thread",
    "summary": "Share the step-by-step framework you use to achieve a desirable outcome.",
    "template": "In [date], I experienced X problem.\n\nThen, I did [something unconventional].\n\nHere's the X-Step framework I use to achieve [highly desirable outcome]\n\n🧵👇\n\nStep 1: (What is it?)\n\nMost people think X.\n\nInstead, I want you to think Y (opposite of X).\n\nIf you do this, here are",
    "category": "Educational Breakdown"
  },
  {
    "id": "transformation-story",
    "title": "Transformation Story",
    "summary": "Share a story about how you went from being stuck to where you are today.",
    "template": "Origin story: when I was X, I was stuck, experiencing:\n\n• Pain point #1\n\n• Pain point #2\n\n• Pain point #3\n\nY years later, I'm here now.\n\nOne sentence of what's different now.\n\nHere's what this journey taught me about [topic]\n\n🧵👇\n\nLesson #1: One sentence.\n\nQuick story of",
    "category": "Personal Story"
  },
  {
    "id": "industry-insights",
    "title": "Industry Insights",
    "summary": "Shed some light on where you believe the future is headed.",
    "template": "The {Niche} industry is on fire.\n\nSome stats:\n\n1. {Stat1}\n\n2. {Stat2}\n\n3. {Stat3}\n\nBut it's not until you break each of these stats down that you realize how quickly the {Niche} industry",
    "category": "Insight & Prediction"
  },
  {
    "id": "life-lessons",
    "title": "Life Lessons",
    "summary": "Share the timeless wisdom that has made the biggest difference in your life.",
    "template": "{X} rules for a life",
    "category": "Advice & Life Lessons"
  },
  {
    "id": "best-threads",
    "title": "Best Threads",
    "summary": "Thread hook: share some of your threads that have gone viral.",
    "template": "I started writing threads on Twitter in {Year}.\n\nSince then, I've written more than {X} threads and accumulated",
    "category": "Personal Story"
  },
  {
    "id": "books-instead-of-college",
    "title": "Books Instead of College",
    "summary": "A thread hook for a list of books to read instead of spending thousands on college tuition.",
    "template": "The average tuition for an MBA comes to $60,000 per year.\n\nThat means you're $120,000 in debt...\n\n...before you begin your [Industry] journey!\n\nOr, you could spend less than $250 and read these 8 legendary books on [Topic1], [Topic2], [Topic3]:",
    "category": "Book-Based"
  },
  {
    "id": "books-worth-reading",
    "title": "Books Worth Reading",
    "summary": "Thread hook for a list of books you think are worth reading.",
    "template": "Over the past [X] years, I have read over [X] [Topic] books.\n\n99% were 1 idea stretched across 300 pages.\n\nThey should have been blog posts.\n\nSave yourself the time and just read these [X]:",
    "category": "Book-Based"
  },
  {
    "id": "every-single-day",
    "title": "Every Single Day",
    "summary": "A thread hook sharing 5 activities you look forward to doing every day.",
    "template": "Every single day, I wake up ecstatic to do 5 things:\n\n1) [Activity1]\n\n2) [Activity2]\n\n3) [Activity3]\n\n4) [Activity4]\n\n5) [Activity5]\n\nEach for different reasons:",
    "category": "Advice & Life Lessons"
  },
  {
    "id": "framework-for-success",
    "title": "Framework For Success",
    "summary": "Thread hook that introduces the framework you have used to achieve outcomes.",
    "template": "In [Year], I [Outcome].\n\nIn [FollowingYear], I [DoubledOutcome].\n\nHere's the [X]-step framework I used to [Outcome1] and [Outcome2]—and how I plan on [GiantOutcome3] again next year:",
    "category": "Educational Breakdown"
  },
  {
    "id": "masterclass-synopsis",
    "title": "MasterClass Synopsis",
    "summary": "Thread hook for a synopsis of a MasterClass you have taken.",
    "template": "[FamousPerson] is one of the [Credibility] of all time.\n\n[FamousOutcome1]\n\n[FamousOutcome2]\n\n[FamousOutcome3]\n\nI am fascinated by [his/her] career.\n\nSo I watched [his/her] MasterClass (twice!).\n\nHere are the golden nuggets:",
    "category": "Social Proof / Spotlight"
  },
  {
    "id": "morning-habit",
    "title": "Morning Habit",
    "summary": "A thread hook introducing a habit you do every single morning.",
    "template": "I [Habit] every single morning for at least [X] minutes.\n\nI've been doing this since [Year].\n\nBut over the years, I've learned you can (very easily) overcomplicate the act of [Habit].\n\nWhich is why now I only use [X] simple [Techniques]:",
    "category": "Advice & Life Lessons"
  },
  {
    "id": "proven-tips-thread-of-threads",
    "title": "Proven Tips (Thread of Threads)",
    "summary": "A thread hook introducing a thread of powerful tips you've shared over time.",
    "template": "Over the past year, I have tweeted hundreds of small (but powerful) [Topic] Tips.\n\nBut these [X] accumulated more than [X] views and thousands of comments & shares.\n\nHere they are all in one place:",
    "category": "Meta / Reflection on Writing"
  },
  {
    "id": "rules-to-live-by",
    "title": "Rules to Live By",
    "summary": "Thread hook for rules of success to live by.",
    "template": "I have been [Topic] for [X] years.\n\nIn that time, I have [Outcome] more times than I can count.\n\nThese are the [X] rules of success I live by—to create things that have a giant impact:",
    "category": "Advice & Life Lessons"
  },
  {
    "id": "tips-to-hang-on-your-wall",
    "title": "Tips To Hang On Your Wall",
    "summary": "A hook for a thread about {Topic} tips you should hang on your wall.",
    "template": "[X] [Topic] tips you should hang on your wall:",
    "category": "Advice & Life Lessons"
  },
  {
    "id": "topic-101",
    "title": "Topic 101",
    "summary": "A hook for a thread where you can share the templates you use every time to achieve success.",
    "template": "[Topic] 101\n\nOver the past [X] years, I have [Credibility1], [Credibility2], [Credibility3].\n\nWant to know a secret?\n\nI use the same [X] templates every time:",
    "category": "Educational Breakdown"
  },
  {
    "id": "personal-stories",
    "title": "Personal Stories",
    "summary": "Tell stories that allow readers to see themselves in you.",
    "template": "When I [OldLifeCompleted], I [NewLifeBeginning].\n\nIt was [NegativeDetail].\n\n[NegativeDetail]. [NegativeDetail].\n\n[X] years later, I just [LifeAchievement].\n\nHere's what those difficult years taught me about [Topic]:\n\nLesson 1: [Lesson1]\n\nBack then, I used to [PositiveHabit].\n\nDespite [NegativeObstacle].\n\nThe only difference between then and now is [UnexpectedSmallDetail].\n\nLesson 2: [Lesson2]\n\nFor the first few years, all I had was a [HumbleBeginning] and a [HumbleBeginning].\n\nSince then, I've [PositiveOutcome].\n\nBut can I tell you something?\n\nThose two [HumbleBeginnings] still mean more to me than anything.\n\nAll you need.\n\nLesson 3: [Lesson3]\n\nWhen I was first starting out, I was so determined to achieve [X] that I deprived myself of [ShortTermOutcome].\n\nEveryone thought I was crazy.\n\nBut, [X] years later, I had successfully become [Outcome].\n\nMeanwhile, a lot of people around me hadn't moved at all.\n\nLesson 4: [Lesson4]\n\nI used to be very insecure about [Weakness].\n\nI was ashamed that I didn't have [Outcome].\n\nAnd I didn't [PositiveAction] because of it.\n\nIt took me a long time to realize those insecurities were holding me back.\n\nAnd no amount of success would fix them for me.\n\nLesson 5: [Lesson5]\n\nAfter college, a lot of people around me said:\n\n[WrongAdvice]\n\nBut then I'd watch them struggle to make progress in their own lives.\n\nA big part of success is going in a different direction.\n\nAnd remember: if it was easy, everyone would do it.",
    "category": "Advice & Life Lessons"
  }
];

// Template matching functions
export function getTemplatesByCategory(category: TemplateCategory): TwitterTemplate[] {
  return TWITTER_TEMPLATES.filter(template => template.category === category);
}

export function getAllCategories(): TemplateCategory[] {
  return Array.from(new Set(TWITTER_TEMPLATES.map(t => t.category))) as TemplateCategory[];
}

export function getTemplateById(id: string): TwitterTemplate | undefined {
  return TWITTER_TEMPLATES.find(template => template.id === id);
}

// Content analysis and template matching
export interface ContentAnalysis {
  hasPersonalStory: boolean;
  hasStatistics: boolean;
  hasQuotes: boolean;
  hasNamedPeople: boolean;
  hasFrameworks: boolean;
  hasBookReferences: boolean;
  mainTopics: string[];
  tone: 'inspirational' | 'educational' | 'analytical' | 'controversial' | 'personal';
}

export interface TemplateMatch {
  template: TwitterTemplate;
  score: number;
  reason: string;
}

export function analyzeContent(content: string): ContentAnalysis {
  const hasPersonalStory = /\b(I|my|me|when I|my story|my journey)\b/i.test(content);
  const hasStatistics = /\b\d+%|\b\d+\s*(million|billion|thousand|users|customers|dollars)\b/i.test(content);
  const hasQuotes = /"[^"]*"/g.test(content) || /'[^']*'/g.test(content);
  const hasNamedPeople = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/.test(content);
  const hasFrameworks = /\b(framework|method|system|process|steps?|approach)\b/i.test(content);
  const hasBookReferences = /\b(book|author|read|chapter)\b/i.test(content);
  
  // Extract main topics (simplified - could be enhanced with NLP)
  const topicMatches = content.toLowerCase().match(/\b(business|marketing|psychology|productivity|leadership|entrepreneurship|technology|design|writing|health|fitness|finance|investing|career|education|creativity|communication|sales|management|strategy)\b/g);
  const mainTopics = topicMatches ? Array.from(new Set(topicMatches)) : [];
  
  // Determine tone (simplified)
  let tone: 'inspirational' | 'educational' | 'analytical' | 'controversial' | 'personal' = 'educational';
  if (hasPersonalStory) tone = 'personal';
  else if (/\b(inspiring|motivat|dream|goal|success)\b/i.test(content)) tone = 'inspirational';
  else if (/\b(analysis|data|research|study)\b/i.test(content)) tone = 'analytical';
  else if (/\b(wrong|myth|misconception|controversial|unpopular)\b/i.test(content)) tone = 'controversial';
  
  return {
    hasPersonalStory,
    hasStatistics,
    hasQuotes,
    hasNamedPeople,
    hasFrameworks,
    hasBookReferences,
    mainTopics,
    tone
  };
}

export function getTemplateMatches(content: string, maxResults: number = 5): TemplateMatch[] {
  const analysis = analyzeContent(content);
  const matches: TemplateMatch[] = [];
  
  for (const template of TWITTER_TEMPLATES) {
    let score = 0;
    let reasons: string[] = [];
    
    // Score based on content characteristics
    if (analysis.hasPersonalStory && template.category === 'Personal Story') {
      score += 30;
      reasons.push('Contains personal story elements');
    }
    
    if (analysis.hasStatistics && (template.category === 'Educational Breakdown' || template.category === 'Insight & Prediction')) {
      score += 20;
      reasons.push('Contains statistics and data');
    }
    
    if (analysis.hasNamedPeople && (template.category === 'Social Proof / Spotlight' || template.category === 'Curation')) {
      score += 25;
      reasons.push('Mentions specific people');
    }
    
    if (analysis.hasBookReferences && template.category === 'Book-Based') {
      score += 35;
      reasons.push('Contains book references');
    }
    
    if (analysis.hasFrameworks && template.category === 'Educational Breakdown') {
      score += 25;
      reasons.push('Contains frameworks or processes');
    }
    
    // Tone matching
    if (analysis.tone === 'personal' && template.category === 'Personal Story') {
      score += 15;
      reasons.push('Personal tone matches template');
    }
    
    if (analysis.tone === 'educational' && template.category === 'Educational Breakdown') {
      score += 15;
      reasons.push('Educational tone matches template');
    }
    
    if (analysis.tone === 'inspirational' && template.category === 'Advice & Life Lessons') {
      score += 15;
      reasons.push('Inspirational tone matches template');
    }
    
    // Topic relevance (basic keyword matching)
    const templateLower = template.template.toLowerCase();
    for (const topic of analysis.mainTopics) {
      if (templateLower.includes(topic)) {
        score += 10;
        reasons.push(`Relevant to ${topic} topic`);
      }
    }
    
    // Add some randomness to avoid always showing the same templates
    score += Math.random() * 5;
    
    if (score > 0) {
      matches.push({
        template,
        score,
        reason: reasons.join(', ') || 'General content match'
      });
    }
  }
  
  // Sort by score and return top matches
  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

// Placeholder extraction
export interface PlaceholderData {
  [key: string]: string;
}

export function extractPlaceholders(template: string): string[] {
  const placeholderRegex = /\[([^\]]+)\]/g;
  const placeholders: string[] = [];
  let match;
  
  while ((match = placeholderRegex.exec(template)) !== null) {
    if (!placeholders.includes(match[1])) {
      placeholders.push(match[1]);
    }
  }
  
  return placeholders;
}

export function extractPlaceholderData(content: string, template: string): PlaceholderData {
  const placeholders = extractPlaceholders(template);
  const data: PlaceholderData = {};
  
  // Extract basic data from content (simplified - could be enhanced with NLP)
  for (const placeholder of placeholders) {
    const lowerPlaceholder = placeholder.toLowerCase();
    
    // Extract names
    if (lowerPlaceholder.includes('name') || lowerPlaceholder.includes('author')) {
      const nameMatch = content.match(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/);
      if (nameMatch) data[placeholder] = nameMatch[0];
    }
    
    // Extract numbers/statistics
    else if (lowerPlaceholder.includes('x') || lowerPlaceholder.includes('stat') || lowerPlaceholder.includes('number')) {
      const numberMatch = content.match(/\b\d+\b/);
      if (numberMatch) data[placeholder] = numberMatch[0];
    }
    
    // Extract topics
    else if (lowerPlaceholder.includes('topic') || lowerPlaceholder.includes('skill') || lowerPlaceholder.includes('niche')) {
      const topicMatches = content.toLowerCase().match(/\b(business|marketing|psychology|productivity|leadership|entrepreneurship|technology|design|writing|health|fitness|finance|investing|career|education|creativity|communication|sales|management|strategy)\b/);
      if (topicMatches) data[placeholder] = topicMatches[0];
    }
    
    // Extract quotes
    else if (lowerPlaceholder.includes('quote')) {
      const quoteMatch = content.match(/"([^"]*)"/) || content.match(/'([^']*)'/);
      if (quoteMatch) data[placeholder] = quoteMatch[1];
    }
    
    // Default to generic placeholder text
    if (!data[placeholder]) {
      data[placeholder] = `[${placeholder}]`;
    }
  }
  
  return data;
}

export function fillTemplate(template: string, data: PlaceholderData): string {
  let result = template;
  
  for (const [placeholder, value] of Object.entries(data)) {
    const regex = new RegExp(`\\[${placeholder}\\]`, 'g');
    result = result.replace(regex, value);
  }
  
  return result;
}