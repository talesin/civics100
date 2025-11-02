# US Civics Test - Practice Website

Interactive web application for practicing the US Citizenship Test.

## Quick Start

```bash
npm install
npm run dev
# Visit http://localhost:3000
```

## 2025 USCIS Test Format

- **20 questions** by default (customizable to 50 or 100)
- **Pass with 12 correct** answers (60% threshold)
- **Early win**: Auto-complete when pass threshold is reached
- **Early fail**: Auto-end after 9 incorrect answers
- **Pass rates**: Choose from 60%, 70%, 80%, 90%, or 100%

## Features

- Interactive quiz with keyboard navigation
- Dark/light mode
- Progress tracking and statistics
- Responsive design
- Offline-ready (static export)

## Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm test             # Run tests
npm run lint         # Check code quality
```

## Tech Stack

- Next.js 15 (App Router)
- TypeScript (strict mode)
- Effect-TS (functional patterns)
- Tailwind CSS v4
- Jest + React Testing Library

## How to Play

1. Start a practice test
2. Answer questions (click or use keyboard 1-4/A-D)
3. Game ends when you pass, fail (9 incorrect), or finish all questions
4. Review your results and statistics

## License

MIT
