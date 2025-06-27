// Hook Generation System Types

import { TwitterTemplate, TemplateMatch } from './templates';

// Export template-related types
export type { TwitterTemplate, TemplateMatch } from './templates';

// Content Analysis type
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

// Power Hook data structure (new primary hook system)
export interface PowerHook {
  id: string;
  text: string;
  category: string;
  type: string;
  variables: string[];
}

// Power Hook matching and scoring
export interface PowerHookMatch {
  powerHook: PowerHook;
  score: number;
  reason: string;
  variableData: Record<string, string>;
}

// Hook data structure (updated to support power hooks)
export interface Hook {
  id: string;
  text: string;
  templateId?: string; // null for custom Claude hooks
  templateTitle?: string;
  templateCategory?: string;
  powerHookId?: string; // for power hook-based generation
  powerHookCategory?: string;
  variation: 1 | 2;
  type: 'template' | 'custom' | 'power-hook';
  score?: number; // Template/power hook relevance score
}

// Hook generation request/response
export interface GenerateHooksRequest {
  content: string;
  personalContext?: string;
  globalRules?: string;
}

export interface GenerateHooksResponse {
  hooks: Hook[];
  topTemplates: TemplateMatch[]; // Top 5 templates used (for supporting content)
  topPowerHooks: PowerHookMatch[]; // Top power hooks selected
  contentAnalysis: ContentAnalysis;
}

// Thread generation from selected hooks
export interface GenerateThreadsRequest {
  content: string;
  selectedHookIds: string[]; // 2 selected hook IDs
  selectedHooks?: Hook[]; // Full hook data
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
  contentAnalysis?: ContentAnalysis;
  
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
  contentAnalysis: ContentAnalysis;
  personalContext?: string;
  variation: 1 | 2;
}

// Power hook generation context
export interface PowerHookGenerationContext {
  content: string;
  powerHook: PowerHook;
  variableData: Record<string, string>;
  personalContext?: string;
  toneProfile?: string;
  templateStructure?: TwitterTemplate; // Supporting template for content structure
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

// Tweet editing and rewriting types
export interface RewriteRequest {
  selectedText: string;
  fullTweet: string;
  rewriteType: 'grammar' | 'improve' | 'punchy' | 'condense' | 'rephrase';
  customPrompt?: string;
  threadContext?: string[];
  personalContext?: string;
  globalRules?: string;
}

export interface RewriteResponse {
  rewrittenText: string;
  originalText: string;
}

export interface TextSelection {
  text: string;
  start: number;
  end: number;
}

export interface EditableTweetState {
  isEditing: boolean;
  originalText: string;
  currentText: string;
  hasChanges: boolean;
}