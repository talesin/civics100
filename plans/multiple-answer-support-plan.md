# Multiple Answer Support Implementation Plan

## Problem Statement
Some questions in the USCIS Civics Test require 2 or more answers, but the current implementation only allows users to select 1 answer. This affects both the CLI and web versions of the application.

## Current Architecture Analysis

### Question Pairing System
The current implementation uses a "paired question" approach where questions requiring multiple answers are split into individual questions, each with a single correct answer. This design decision has implications:

**Pros:**
- Simplifies answer validation
- Enables granular tracking of which specific answers users know
- Maintains consistency in the data model

**Cons:**
- Doesn't match the original USCIS test format
- May confuse users expecting to select multiple answers
- Questions appear multiple times with slight variations

### Example
Question 9: "What are two rights in the Declaration of Independence?"
- Currently split into multiple questions, each asking for one right
- User answers them separately
- Expected answers: 2, but handled as separate single-answer questions

## Implementation Strategy

### Phase 1: Type System Updates

1. **Update Core Types** (`questionnaire/src/types.ts`)
   - Change `selectedAnswer` from single index to array of indices
   - Add `expectedAnswers` field to Question interface
   - Update `correctAnswer` to support array of correct indices

2. **Update Web Types** (`website/src/types/index.ts`)
   - Sync type changes with core types
   - Ensure consistency across packages

### Phase 2: Data Model Decision

**Option A: Maintain Paired Questions (Minimal Change)**
- Keep current data structure
- Add UI hints when questions are part of a set
- Group related questions visually

**Option B: Unified Multi-Answer Questions (Recommended)**
- Merge paired questions back into single multi-answer questions
- Store all correct answers in a single question
- Better matches USCIS test format

### Phase 3: Core Logic Updates

1. **GameService Updates** (`questionnaire/src/services/GameService.ts`)
   - Update answer validation to check arrays
   - Modify scoring logic for partial credit options
   - Handle state management for multiple selections

2. **Answer Validation Logic**
   - Implement "all or nothing" vs "partial credit" scoring options
   - Define how to handle over-selection (e.g., user selects 3 when 2 required)

### Phase 4: User Interface Updates

1. **CLI Interface** (`questionnaire/src/cli/CLIGameService.ts`)
   - Accept comma-separated answers (e.g., "A,C" or "1,3")
   - Clear prompts indicating number of required answers
   - Validation feedback for incorrect number of selections

2. **Web Interface** (`website/src/components/GameQuestion.tsx`)
   - Replace radio buttons with checkboxes for multi-answer questions
   - Display "Select X answers" instruction
   - Disable submit until correct number selected
   - Visual feedback for selection count

### Phase 5: User Experience Enhancements

1. **Clear Visual Indicators**
   - Bold/highlight the number required (e.g., "Select **2** answers")
   - Progress indicator showing X/Y selected
   - Different styling for multi-answer questions

2. **Validation Feedback**
   - "Please select exactly 2 answers"
   - Highlight which answers were correct/incorrect
   - Show all correct answers after submission

### Phase 6: Testing Strategy

1. **Unit Tests**
   - Test multiple answer validation logic
   - Test partial vs complete scoring
   - Edge cases (over-selection, under-selection)

2. **Integration Tests**
   - CLI flow with multiple answers
   - Web interface interaction
   - Data consistency

## Implementation Order

1. **Start with Type Updates** - Foundation for all changes
2. **Update Core Logic** - GameService and validation
3. **Implement CLI Changes** - Simpler interface to test with
4. **Implement Web Changes** - More complex UI updates
5. **Add Comprehensive Tests** - Ensure reliability
6. **Polish UX** - Clear instructions and feedback

## Technical Considerations

1. **Backwards Compatibility**
   - Consider migration path for existing game data
   - Handle old single-answer format gracefully

2. **Performance**
   - Minimal impact expected
   - Array operations are efficient for small answer sets

3. **Accessibility**
   - Ensure screen readers announce multi-answer requirements
   - Keyboard navigation for checkbox selection

## Success Criteria

1. Users can select multiple answers when required
2. Clear indication of how many answers to select
3. Proper validation and feedback
4. Consistent behavior across CLI and web
5. All tests passing
6. Maintains existing functionality for single-answer questions

## Estimated Effort

- Type System Updates: 2-3 hours
- Core Logic Updates: 3-4 hours
- CLI Implementation: 2-3 hours
- Web Implementation: 4-5 hours
- Testing: 3-4 hours
- UX Polish: 2-3 hours

**Total: 16-22 hours**

## Next Steps

1. Review and approve this plan
2. Decide on Option A vs Option B for data model
3. Create feature branch `feature/multiple-answer-support`
4. Begin implementation with type system updates