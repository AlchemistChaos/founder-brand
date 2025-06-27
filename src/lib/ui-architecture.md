# UI Architecture for 2-Step Hook Generation System

## Component Hierarchy

```
page.tsx (Main App)
├── ContentInput
├── HookSelector (NEW - replaces ThreadTypeSelector)
│   ├── HookCard (NEW) × 10
│   │   ├── HookText
│   │   ├── TemplateInfo
│   │   ├── SelectionCheckbox
│   │   └── MatchReason
│   ├── HookFilters (NEW - optional)
│   └── SelectionActions (NEW)
├── ResultsDisplay (UPDATED)
│   ├── SelectedHooksPreview (NEW)
│   └── ThreadsDisplay (UPDATED)
│       ├── ThreadCard × 2
│       └── ArtPromptsDisplay
├── SettingsModal (UNCHANGED)
└── CustomPromptSelector (UNCHANGED)
```

## Component Specifications

### 1. HookSelector Component

**Purpose**: Display 10 generated hooks and allow user to select 2

**Props**:
```typescript
interface HookSelectorProps {
  hooks: Hook[];
  selectedHookIds: string[];
  onHookSelect: (hookId: string) => void;
  onGenerateThreads: () => void;
  isLoading?: boolean;
  maxSelection?: number; // Default: 2
}
```

**Features**:
- Grid layout (2 columns on mobile, 3-4 on desktop)
- Visual distinction between template and custom hooks
- Selection validation (max 2)
- Template information display
- Match reason tooltips
- Generate button (enabled when 2 selected)

### 2. HookCard Component

**Purpose**: Individual hook display with selection capability

**Props**:
```typescript
interface HookCardProps {
  hook: Hook;
  isSelected: boolean;
  onSelect: (hookId: string) => void;
  disabled?: boolean;
  showTemplateInfo?: boolean;
}
```

**Features**:
- Hook text preview (truncated if long)
- Template badge (category + title)
- Custom hook indicator
- Selection checkbox/toggle
- Match score indicator
- Hover states and animations

### 3. SelectedHooksPreview Component

**Purpose**: Show selected hooks before thread generation

**Props**:
```typescript
interface SelectedHooksPreviewProps {
  selectedHooks: Hook[];
  onRemoveHook: (hookId: string) => void;
  onEditHook?: (hookId: string, newText: string) => void;
}
```

**Features**:
- Compact display of 2 selected hooks
- Remove/replace functionality
- Optional inline editing
- Thread preview hints

### 4. Updated ResultsDisplay Component

**Purpose**: Show generated threads from selected hooks

**Changes**:
- Display 2 threads instead of multiple variations
- Show which hook generated each thread
- Side-by-side comparison view
- Individual copy/export actions per thread

## State Management

### Main App State
```typescript
interface AppState {
  // Step management
  currentStep: 'input' | 'hooks' | 'threads';
  
  // Content
  content: string;
  personalContext?: string;
  customPromptId?: string;
  
  // Hook generation
  hooks: Hook[];
  topTemplates: TemplateMatch[];
  contentAnalysis?: ContentAnalysis;
  
  // Hook selection
  selectedHookIds: string[];
  
  // Thread generation
  threads: TwitterThread[];
  
  // Loading states
  isGeneratingHooks: boolean;
  isGeneratingThreads: boolean;
  
  // Error states
  hookError?: string;
  threadError?: string;
}
```

### State Flow
```
1. User inputs content → setState({ content })
2. Generate hooks → setState({ isGeneratingHooks: true })
3. Hooks received → setState({ hooks, currentStep: 'hooks' })
4. User selects hooks → setState({ selectedHookIds })
5. Generate threads → setState({ isGeneratingThreads: true })
6. Threads received → setState({ threads, currentStep: 'threads' })
```

## UI Flow & Screens

### Screen 1: Content Input
- **Current functionality preserved**
- Content textarea
- Personal context toggle
- Custom prompt selector
- Generate button → triggers hook generation

### Screen 2: Hook Selection (NEW)
- **Header**: "Choose 2 hooks to turn into threads"
- **Subheader**: Shows content analysis summary
- **Hook Grid**: 10 hook cards in responsive grid
- **Selection Counter**: "2 of 2 selected"
- **Action Button**: "Generate Threads" (disabled until 2 selected)
- **Back Button**: Return to content input

### Screen 3: Thread Results (UPDATED)
- **Header**: "Your Generated Threads"
- **Selected Hooks**: Preview of chosen hooks
- **Thread Display**: 2 threads side by side
- **Actions**: Copy, export, regenerate individual threads
- **New Generation**: Button to start over

## Responsive Design

### Mobile (< 768px)
- **Hook Grid**: 1 column, stacked cards
- **Thread Display**: Stacked vertically
- **Hook Cards**: Full width, expanded text
- **Navigation**: Bottom fixed buttons

### Tablet (768px - 1024px)
- **Hook Grid**: 2 columns
- **Thread Display**: Side by side with scroll
- **Hook Cards**: Medium size

### Desktop (> 1024px)
- **Hook Grid**: 3-4 columns
- **Thread Display**: Full side by side
- **Hook Cards**: Compact with hover details

## Accessibility

### Keyboard Navigation
- Tab through hook cards
- Space/Enter to select hooks
- Arrow keys for grid navigation
- Escape to clear selection

### Screen Reader Support
- Proper ARIA labels for hook cards
- Selection state announcements
- Progress indicators for generation steps
- Clear headings and landmarks

### Visual Indicators
- High contrast selection states
- Loading spinners with text
- Error states with clear messaging
- Success states with confirmations

## Animation & Feedback

### Hook Selection
- Smooth checkbox animations
- Card border highlights
- Selection counter updates
- Progress bar to next step

### Loading States
- Skeleton cards during hook generation
- Progress indicators for each step
- Shimmer effects for content areas
- Spinner with estimated time

### Transitions
- Smooth step transitions
- Fade in/out for content changes
- Slide animations for mobile navigation
- Micro-interactions for selections

## Performance Considerations

### Hook Generation
- Progressive loading of hooks
- Skeleton UI while generating
- Error retry mechanisms
- Timeout handling

### Large Content Handling
- Text truncation in cards
- Expandable hook previews
- Virtualized lists if needed
- Efficient re-renders

### Memory Management
- Clean up previous hooks on new generation
- Efficient state updates
- Proper component unmounting
- Image optimization for templates

## Error Handling

### Hook Generation Errors
- Network errors → retry button
- API errors → error message + fallback
- Timeout errors → progress indicator + retry
- Content errors → input validation hints

### Selection Errors
- Too many selected → visual feedback
- No selection → disabled generate button
- Invalid hooks → error state + recovery

### Thread Generation Errors
- Partial failures → show successful threads
- Complete failures → retry with different hooks
- Network issues → offline indicators
- API limits → clear messaging

## Testing Strategy

### Unit Tests
- Hook card selection logic
- State management functions
- Validation functions
- Error handling

### Integration Tests
- Full hook selection flow
- Thread generation from hooks
- Step navigation
- Error recovery

### E2E Tests
- Complete user journey
- Different content types
- Mobile responsiveness
- Accessibility compliance