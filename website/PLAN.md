# US Civics 100 Website Implementation Plan

## Overview

Implement an interactive web-based questionnaire for US Civics questions based on the specifications in website/SPEC.md. The website will be built with Next.js, TypeScript, Effect-TS, and Tailwind CSS as a static site deployable to GitHub Pages.

## Current State Analysis

- Existing Infrastructure: Monorepo with npm workspaces including civics2json and questionnaire packages
- Data Available: Complete civics questions in JSON format at /civics2json/data/civics-questions.json
- Question Logic: Existing questionnaire package has services for question selection and game logic
- Website Directory: Currently only contains SPEC.md, needs full Next.js setup

## Implementation Phases

### Phase 1: Initial Setup & Configuration

- Create Next.js Application in /website directory
- Initialize Next.js with TypeScript support
- Configure for static export (output: 'export')
- Setup Tailwind CSS with dark mode support
- Configure ESLint and Prettier matching existing standards
- Integrate Effect-TS
- Install Effect-TS dependencies
- Setup Effect services pattern per code-style-guide.md
- Configure build tools to handle Effect-TS
- Configure Build Pipeline
- Setup static site generation for GitHub Pages
- Configure base path for GitHub Pages deployment
- Add build scripts to workspace

### Phase 2: Data Integration Layer

- 1. Question Data Service
- Create Effect service to load civics questions
- Implement Effect schemas for question validation
- Integrate with existing questionnaire logic
- 2. Session Management Service
- Implement game session state (10 questions, 6 correct to win)
- Handle question randomization and selection
- Track user progress and scores
- 3. Local Storage Service
- Persist user results between sessions
- Store dark mode preference
- Handle data migration/versioning

### Phase 3: Core Components

- 1. Layout Components
- App shell with header and footer
- Navigation component with logo
- Responsive mobile menu
- 2. Home Page
- Welcome section with game description
- Previous results display
- "Take the Questionnaire" CTA button
- Information links about US Civics
- 3. Game Components
- Question card component with flip animation
- Answer selection buttons
- Progress indicator (e.g., "Card 3 of 10")
- Next button/auto-advance functionality
- 4. Results Page
- Score display with percentage
- Early completion message (if 6 correct reached)
- Retake quiz button
- Return to homepage button

### Phase 4: Game Logic Implementation

- 1. Game Flow Service
- Initialize 10-question session
- Handle answer selection and validation
- Implement early completion logic (6 correct)
- Calculate and store results
- 2. State Management
- Use React hooks for UI state
- Effect-TS for side effects and data flow
- No external state libraries (per guidelines)
- 3. Animation & Transitions
- Card slide animations between questions
- Answer feedback animations
- Page transitions

### Phase 5: Styling & Polish

- 1. Design System
- Define color palette for light/dark modes
- Typography scale
- Component spacing and layout grid
- 2. Responsive Design
- Mobile-first approach
- Tablet and desktop breakpoints
- Touch-friendly interactions
- 3. Accessibility
- ARIA labels and roles
- Keyboard navigation
- Screen reader support

### Phase 6: Testing & Quality

- 1. Unit Tests
- Test Effect services with test layers
- Component testing with React Testing Library
- Game logic validation
- 2. Integration Tests
- Full game flow testing
- Local storage persistence
- Error handling scenarios
- 3. Performance Optimization
- Code splitting
- Image optimization
- Lighthouse audits

### Phase 7: Deployment

- 1. GitHub Pages Setup
- Configure GitHub Actions workflow
- Setup custom domain (if needed)
- Environment configuration
- 2. Documentation
- Update README with website information
- Add deployment instructions
- Document local development setup

### Phase 8: Technical Decisions

- No Redux/Zustand: Use Effect-TS services and React hooks
- Static Generation: All pages pre-rendered at build time
- Effect-TS Patterns: Follow established patterns from civics2json
- Type Safety: Strict TypeScript with Effect schemas for runtime validation

### Phase 9: Success Criteria

- 10 random questions per session
- Game ends at 6 correct answers or 10 total
- Results persist between sessions
- Dark mode support
- Fully responsive design
- Deployed to GitHub Pages
- All tests passing
- Meets accessibility standards

### Phase 10: Documentation

- Update README with website information
- Add deployment instructions
- Document local development setup

### Technical Decisions

- No Redux/Zustand: Use Effect-TS services and React hooks
- Static Generation: All pages pre-rendered at build time
- Effect-TS Patterns: Follow established patterns from civics2json
- Type Safety: Strict TypeScript with Effect schemas for runtime validation

### Success Criteria

- 10 random questions per session
- Game ends at 6 correct answers or 10 total
- Results persist between sessions
- Dark mode support
- Fully responsive design
- Deployed to GitHub Pages
- All tests passing
- Meets accessibility standards