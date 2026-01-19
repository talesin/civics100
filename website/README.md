# US Civics Test - Practice Website

Interactive web application for practicing the US Citizenship Test with all 128 official USCIS civics questions.

## Quick Start

```bash
npm install
npm run dev
# Visit http://localhost:3000
```

## 2025 USCIS Test Format

- **20 questions** by default (customizable to 50 or all 128)
- **Pass with 12 correct** answers (60% threshold, adjustable)
- **Early win**: Auto-complete when pass threshold is reached
- **Early fail**: Auto-end after 9 incorrect answers

## Features

### Quiz Experience

- Interactive quiz with 128 official USCIS civics questions
- Customizable test length (20, 50, or all questions)
- Adjustable pass rate (60%, 70%, 80%, 90%, 100%)
- Early win/fail mechanics with auto-completion
- Sound effects for answer feedback

### Accessibility & Navigation

- Full keyboard navigation (1-4 or A-D to select answers)
- Dark/light mode with system preference detection
- Responsive design (mobile-first)

### Personalization

- State-specific questions (senators, representatives, governor)
- Congressional district selection for representative questions
- Settings persist across sessions

### Progress Tracking

- Detailed statistics and history
- Adaptive learning (tracks question performance)
- Question-by-question accuracy breakdown

## Commands

```bash
npm run dev          # Development server
npm run build        # Production build (includes lint + test)
npm test             # Run tests
npm run lint         # Check code quality
```

## Tech Stack

- **Next.js 15** (App Router, Turbopack)
- **React 19**
- **TypeScript** (strict mode)
- **Tamagui** - Cross-platform UI framework with compile-time optimization
- **Effect-TS** - Functional programming patterns, service architecture
- **Jest + React Testing Library** - Testing

## Project Structure

```
website/
├── src/
│   ├── app/           # Next.js App Router pages
│   ├── components/    # React components (Tamagui-styled)
│   ├── services/      # Effect-TS services
│   ├── hooks/         # Custom React hooks
│   └── types/         # TypeScript definitions
├── test/              # Jest test files
├── tamagui.config.ts  # Tamagui theme configuration
└── package.json
```

## How to Play

1. Configure your test settings (optional)
2. Start a practice test
3. Answer questions (click or use keyboard 1-4/A-D)
4. Game ends when you pass, fail (9 incorrect), or finish all questions
5. Review your results and detailed statistics

## License

MIT
