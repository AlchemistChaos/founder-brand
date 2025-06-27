# API Contracts for 2-Step Hook Generation System

## Overview
The new system replaces the single-step thread generation with a 2-step process:
1. **Hook Generation**: Generate 10 hooks (8 from templates + 2 custom)
2. **Thread Generation**: Create full threads from 2 selected hooks

## API Endpoints

### 1. Hook Generation: `POST /api/generate-hooks`

#### Request
```typescript
{
  content: string;                    // The input content to analyze
  personalContext?: string;           // Optional personal context
}
```

#### Response
```typescript
{
  hooks: Hook[];                      // Array of 10 generated hooks
  topTemplates: TemplateMatch[];      // Top 5 templates used (with scores)
  contentAnalysis: ContentAnalysis;   // Analysis results
}
```

#### Hook Structure
```typescript
{
  id: string;                         // Unique identifier
  text: string;                       // The hook text
  templateId?: string;                // Template ID (null for custom hooks)
  templateTitle?: string;             // Human-readable template name
  templateCategory?: string;          // Template category
  variation: 1 | 2;                   // Variation number
  type: 'template' | 'custom';        // Hook type
  score?: number;                     // Relevance score (for template hooks)
}
```

#### Generation Logic
- **Hooks 1-2**: Best scoring template (2 variations)
- **Hooks 3-4**: 2nd best template (2 variations)
- **Hooks 5-6**: 3rd best template (2 variations)
- **Hooks 7-8**: 4th best template (2 variations)
- **Hooks 9-10**: Custom Claude hooks (2 creative variations)

---

### 2. Thread Generation: `POST /api/generate` (Updated)

#### Request
```typescript
{
  content: string;                    // Original input content
  selectedHookIds: string[];          // Array of 2 selected hook IDs
  personalContext?: string;           // Optional personal context
  customPromptId?: string;            // Optional custom prompt override
}
```

#### Response
```typescript
{
  threads: TwitterThread[];          // Array of 2 generated threads
  selectedHooks: Hook[];              // The hooks that were used
}
```

#### TwitterThread Structure (Enhanced)
```typescript
{
  id: string;                         // Unique thread identifier
  hookId: string;                     // References the selected hook
  tweets: string[];                   // Array of tweet text
  templateId?: string;                // Template used (if applicable)
  templateTitle?: string;             // Template name (if applicable)
  artPrompts?: string[];              // Generated art prompts
}
```

---

## Error Handling

### Standard Error Response
```typescript
{
  error: string;                      // Error message
  details?: string;                   // Additional details
  code?: string;                      // Error code
}
```

### Common Error Codes
- `CONTENT_TOO_SHORT`: Input content is insufficient
- `CONTENT_TOO_LONG`: Input content exceeds limits
- `TEMPLATE_SCORING_FAILED`: Template analysis failed
- `HOOK_GENERATION_FAILED`: Hook generation failed
- `INVALID_HOOK_SELECTION`: Invalid hook IDs provided
- `THREAD_GENERATION_FAILED`: Thread generation failed
- `OPENAI_API_ERROR`: OpenAI API error

---

## Implementation Notes

### Hook Generation Process
1. **Content Analysis**: Analyze input for characteristics
2. **Template Scoring**: Score all templates against content
3. **Template Selection**: Pick top 5 templates
4. **Hook Generation**: Generate 2 variations per template (8 total)
5. **Custom Hook Generation**: Generate 2 creative hooks
6. **Response Assembly**: Return all 10 hooks with metadata

### Thread Generation Process
1. **Hook Validation**: Validate selected hook IDs
2. **Context Assembly**: Combine content, hooks, personal context
3. **Thread Generation**: Generate full threads for each selected hook
4. **Art Prompt Generation**: Generate art prompts for threads
5. **Response Assembly**: Return threads with metadata

### Template Integration
- Templates provide structure and style guidance
- Placeholder extraction fills template variables from content
- Personal context integrates with template placeholders
- Custom prompts can override template instructions

### Performance Considerations
- Hook generation: ~10-15 seconds (multiple API calls)
- Thread generation: ~15-20 seconds (2 thread generations)
- Template scoring: ~1-2 seconds (local computation)
- Total user journey: ~30-40 seconds

### Backward Compatibility
- Existing `/api/generate` endpoint maintains compatibility
- Old thread type system gracefully deprecated
- Custom prompts continue to work with new system
- Personal context integration preserved

---

## Migration Strategy

### Phase 1: Add New Endpoints
- Add `/api/generate-hooks` endpoint
- Update `/api/generate` to handle new request format
- Maintain backward compatibility

### Phase 2: Update Frontend
- Replace ThreadTypeSelector with HookSelector
- Implement 2-step flow in main page
- Update results display

### Phase 3: Cleanup
- Remove old hook system
- Clean up unused thread type code
- Remove deprecated interfaces

---

## Testing Strategy

### Unit Tests
- Template scoring accuracy
- Hook generation variety
- Placeholder extraction
- Error handling

### Integration Tests
- Full hook generation flow
- Thread generation from hooks
- Personal context integration
- Custom prompt compatibility

### End-to-End Tests
- Complete user journey
- Various content types
- Error scenarios
- Performance benchmarks