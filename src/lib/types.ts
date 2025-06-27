// Hook Generation System Types

import { TwitterTemplate, TemplateMatch } from './templates';

// Hook data structure
export interface Hook {
  id: string;
  text: string;
  templateId?: string; // null for custom Claude hooks
  templateTitle?: string;
  templateCategory?: string;
  variation: 1 | 2;
  type: 'template' | 'custom';
  score?: number; // Template relevance score (for template hooks)
}

// Hook generation request/response
export interface GenerateHooksRequest {
  content: string;
  personalContext?: string;
  globalRules?: string;
}

export interface GenerateHooksResponse {
  hooks: Hook[];
  topTemplates: TemplateMatch[]; // Top 5 templates used
  contentAnalysis: {
    hasPersonalStory: boolean;
    hasStatistics: boolean;
    hasQuotes: boolean;
    hasNamedPeople: boolean;
    hasFrameworks: boolean;
    hasBookReferences: boolean;
    mainTopics: string[];
    tone: 'inspirational' | 'educational' | 'analytical' | 'controversial' | 'personal';
  };
}

// Thread generation from selected hooks
export interface GenerateThreadsRequest {
  content: string;
  selectedHookIds: string[]; // 2 selected hook IDs
  personalContext?: string;
  globalRules?: string;
  customPromptId?: string;
}

export interface GenerateThreadsResponse {
  threads: TwitterThread[];
  selectedHooks: Hook[];
}

// Twitter thread structure (existing but enhanced)
export interface TwitterThread {
  id: string;
  hookId: string; // References the selected hook
  tweets: string[];
  templateId?: string;
  templateTitle?: string;
  artPrompts?: string[];
}

// UI State types
export type GenerationStep = 'input' | 'hooks' | 'threads';

export interface GenerationState {
  step: GenerationStep;
  content: string;
  personalContext?: string;
  customPromptId?: string;
  
  // Hook generation results
  hooks: Hook[];
  topTemplates: TemplateMatch[];
  contentAnalysis?: GenerateHooksResponse['contentAnalysis'];
  
  // Hook selection
  selectedHookIds: string[];
  
  // Thread generation results  
  threads: TwitterThread[];
  
  // Loading states
  isGeneratingHooks: boolean;
  isGeneratingThreads: boolean;
  
  // Error states
  hookGenerationError?: string;
  threadGenerationError?: string;
}

// Hook generation prompt context
export interface HookGenerationContext {
  content: string;
  template: TwitterTemplate;
  placeholderData: Record<string, string>;
  personalContext?: string;
  variation: 1 | 2;
}

// Custom hook generation context
export interface CustomHookContext {
  content: string;
  contentAnalysis: GenerateHooksResponse['contentAnalysis'];
  personalContext?: string;
  variation: 1 | 2;
}

// Template scoring and selection
export interface TemplateScore {
  template: TwitterTemplate;
  score: number;
  reasons: string[];
  placeholderData: Record<string, string>;
}

// API Error types
export interface APIError {
  error: string;
  details?: string;
  code?: string;
}

// Hook selection validation
export interface HookSelectionValidation {
  isValid: boolean;
  selectedCount: number;
  maxAllowed: number;
  errorMessage?: string;
}

// Generation metrics (for analytics)
export interface GenerationMetrics {
  contentLength: number;
  templatesScored: number;
  topTemplateScore: number;
  hooksGenerated: number;
  timeToGenerateHooks: number;
  timeToGenerateThreads?: number;
  selectedTemplateTypes: string[];
}