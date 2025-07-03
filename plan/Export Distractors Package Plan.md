# Export Distractors Package Plan

Based on the civics2json package structure, I'll configure the distractions package to
export the questions-with-distractors.json data along with TypeScript types.

Key Changes Required:

1. Update package.json

- Add "files": ["dist"] to include dist directory in npm package
- Add exports field with proper entry points for data and types
- Update build script to use tsup instead of tsc for proper bundling
- Add tsup as devDependency

2. Create TypeScript Export Files

- Create src/types.ts - Define TypeScript types for questions with distractors
- Create src/QuestionsWithDistractors.ts - Export the JSON data with proper typing
- Define QuestionWithDistractors type extending civics2json's Question type

3. Update tsconfig.json

- Change "noEmit": true to "noEmit": false since we now want to emit files
- Add proper output directory configuration
- Add paths for data import resolution

4. Build Configuration

- Configure tsup to build both the types and data exports
- Ensure proper ESM format output
- Generate .d.ts files for TypeScript consumers

Files to Create/Modify:

1. package.json - Add exports, files, and build configuration
2. src/types.ts - TypeScript type definitions
3. src/QuestionsWithDistractors.ts - Data export with typing
4. tsconfig.json - Enable emission and configure output
5. Update build process - Use tsup for proper bundling

Export Structure:

// Main export for types
import { QuestionWithDistractors } from 'distractions'

// Data export for questions with distractors
import QuestionsWithDistractors from 'distractions/QuestionsWithDistractors'

This follows the same pattern as civics2json with clean separation of types and data
exports.
