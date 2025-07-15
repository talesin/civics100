<!--
  .github/copilot-instructions.md
  Guidance for AI coding agents in the civics100 monorepo.
-->
# AI Coding Instructions for the civics100 Monorepo

This document provides concise, project-specific guidance to AI agents working in **civics100**, a multi-package repository for ingesting, transforming, and serving U.S. Civics Test data.

## 1. Project Overview
- Monorepo managed via npm workspaces: `civics2json`, `distractions`, `questionnaire`, `website`.
- Root `data/` holds raw HTML and JSON datasets (e.g., `data/civics-questions.json`, `data/senators.json`).
- Core CLI tool in `civics2json/` scrapes USCIS pages and emits normalized JSON.

## 2. Directory Structure & Key Files
- **civics2json/src**: parsing scripts (`parseQuestions.ts`, `QuestionsManager.ts`), schema definitions (`schema.ts`).
- **questionnaire/src**: offline quiz logic and CLI in `QuestionDataService.ts` and `QuestionSelector.ts`.
- **website/src**: Next.js 15 App Router with TypeScript + Effect-TS (see `app/`, `components/`, `services/`).
- **distractions/**: secondary POC workspace—low priority unless tasks target this folder.

## 3. Build & Test Workflows
At root:
```bash
npm install
npm run build       # builds all workspaces
npm test            # runs Jest tests across packages
npm run lint        # ESLint check
```
Within **website/**:
```bash
npm run dev         # Next.js dev server (localhost:3000)
npm run export      # Static export for GitHub Pages
```

## 4. TypeScript Patterns & Effect-TS
- Validation schemas live in `src/schema.ts`, used to parse raw HTML into typed JSON.
- Service classes extend `Effect.Service` (e.g., `LocalStorageService.ts`, `SessionService.ts` in website). Use `Effect.gen` / `Effect.fn` and `Effect.tryPromise` per style guide.
- Prefer pure, curried functions in `utils.ts` and `QuestionsManager.ts`.
- Avoid `any`; rely on schema-driven types and tagged unions (`_tag` fields).

## 5. Testing Conventions
- Test files mirror source paths under `test/`, e.g., `Governors.test.ts` tests `Governors.ts` parsing logic.
- Use provided test layers to mock services (see `TestExampleServiceLayer` pattern in `coding-style-guide.md`).
- Run `npm run test:watch` for test-driven development loops.

## 6. Data Integration & Consumption
- HTML sources: `data/state-governments/*.html`, parsed by `civics2json/src/Governors.ts` and `Senators.ts`.
- Generated JSON under `data/` is imported directly in `website` and `questionnaire` via ES module imports.

## 7. Conventions & Naming
- Descriptive file and function names; follow `coding-style-guide.md` (no abbreviations).
- Keep effectful code inside services; utility functions should be pure and stateless.

---
*Please review and flag any missing details or unclear conventions.*