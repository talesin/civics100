# Update CuratedDistractorService with All 100 Questions

## Current State Analysis

- Current Coverage: Only 5 questions have curated distractors (1, 2, 11, 22, 28)
- Service Structure: Hard-coded database in getCuratedDistractorDatabase() function
- Strategy Document: Comprehensive 10-category framework already exists
- Missing: The comprehensive JSON files that were referenced earlier are no longer
  present

## Plan: Complete Curated Distractor Implementation

### Phase 1: Research and Map All Questions (15 mins)

1. Analyze civics2json Questions - Import and examine all questions to understand:

- Total number of questions (verify if it's actually 100)
- Question types and their distribution
- Current answer formats and structures

2. Create Question-to-Category Mapping - Classify each question into the 10 categories
   from CuratedDistractorStrategy.md:

- Documents, Numbers, Government Bodies, Rights/Freedoms, Principles/Concepts
- Economic Systems, Phrases/Quotes, People (Historical/Current), Places

### Phase 2: Systematic Distractor Curation (45 mins)

3. Expand getCuratedDistractorDatabase() - Add all remaining questions following the
   established pattern:
   "questionNumber": {
   question: "question text",
   answerType: "category",
   correctAnswers: ["answer1", "answer2"],
   curatedDistractors: ["distractor1", "distractor2", "distractor3", "distractor4"],
   rationale: "explanation"
   }
4. Apply Category-Specific Strategies - Use the documented approach for each type:

- Documents: Other foundational American documents
- Numbers: Other significant government numbers
- Government: Other branches/officials at same level
- Rights: Other constitutional rights and freedoms
- Concepts: Other democratic principles
- People: Other figures from same era/role
- Places: Other locations of same type

### Phase 3: Quality Assurance (10 mins)

5. Verify Semantic Appropriateness - Ensure each distractor:

- Matches the answer type (no mixing people with documents)
- Represents plausible but incorrect alternatives
- Provides educational value through common misconceptions

6. Test Integration - Regenerate output file and verify improved coverage

## Expected Outcome

- Complete Coverage: All ~100 civics questions with expert-curated distractors
- Quality Improvement: Elimination of algorithmic mismatches (like states for economic
  questions)
- Educational Value: Semantically appropriate distractors that test actual civics
  knowledge
- Architecture Preserved: Maintains current service structure for future AI integratio
