# civics100

A comprehensive TypeScript monorepo for US Citizenship Test preparation, built with Effect-TS functional programming patterns. Provides data processing, question generation, interactive gaming, and web-based practice interfaces for the official USCIS Civics Test.

## 🎯 Project Overview

civics100 is a complete ecosystem for civics education, consisting of four specialized packages that work together to create engaging practice experiences:

- **Data Processing** ([civics2json](./packages/civics2json)) - Official USCIS data extraction and structuring
- **Question Enhancement** ([distractions](./packages/distractions)) - Intelligent distractor generation
- **Game Engine** ([questionnaire](./packages/questionnaire)) - Interactive quiz logic with adaptive learning
- **Web Interface** ([website](./website)) - Modern React-based practice application

## 🏗️ Architecture

### Monorepo Structure

```
civics100/
├── packages/
│   ├── civics2json/        # Government data processing pipeline
│   ├── distractions/       # Distractor answer generation
│   └── questionnaire/      # Interactive quiz game engine
├── website/                # Next.js web application
├── package.json           # Workspace configuration
└── README.md              # This file
```

### Data Flow

```
Government Sources → civics2json → distractions → questionnaire → website
      ↓                 ↓             ↓              ↓           ↓
   (Raw Data)      (Structured)  (Enhanced)    (Interactive)  (Web UI)
```

1. **[civics2json](./packages/civics2json)** fetches and processes official government data
2. **[distractions](./packages/distractions)** generates contextually relevant incorrect answers  
3. **[questionnaire](./packages/questionnaire)** provides game logic and adaptive learning
4. **[website](./website)** delivers the practice experience via modern web interface

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm 8+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/civics100.git
cd civics100

# Install all dependencies
npm install
```

### Generate Complete Dataset

```bash
# Build all packages and generate question data
npm run build

# Or build individual packages
npm run build --workspace=civics2json
npm run build --workspace=distractions  
npm run build --workspace=questionnaire
npm run build --workspace=website
```

### Development Servers

```bash
# Start Next.js development server
npm run dev --workspace=website

# Start CLI questionnaire game
npm run start --workspace=questionnaire -- --state CA

# Generate fresh question data
npm run package --workspace=civics2json
```

## 📦 Package Details

### [civics2json](./packages/civics2json) - Government Data Pipeline

Comprehensive data processing for official USCIS civics questions and government information.

**Key Features:**
- Fetches from USCIS, Senate.gov, House.gov, and state government websites  
- Processes variable questions (senators, representatives, governors by state)
- Schema validation with Effect-TS
- CLI interface for data operations

**Quick Usage:**
```bash
cd packages/civics2json
npx tsx src/index.ts questions construct
```

[→ Full Documentation](./packages/civics2json/README.md)

### [distractions](./packages/distractions) - Intelligent Distractor Generation

Creates high-quality incorrect answer choices to enhance question difficulty and educational value.

**Key Features:**
- Static distractor pools for consistent categories
- Quality assessment and similarity analysis
- Integration with civics2json question data
- CLI generation pipeline

**Quick Usage:**
```bash
cd packages/distractions
npx tsx src/cli/index.ts
```

[→ Full Documentation](./packages/distractions/README.md)

### [questionnaire](./packages/questionnaire) - Interactive Quiz Engine

Game logic, session management, and adaptive learning for civics practice sessions.

**Key Features:**
- CLI interactive game interface
- Adaptive question selection based on performance
- State-specific question filtering
- Effect-TS service architecture for integration

**Quick Usage:**
```bash
cd packages/questionnaire
npx tsx src/cli/index.ts --state CA
```

[→ Full Documentation](./packages/questionnaire/README.md)

### [website](./website) - Web Practice Interface

Modern Next.js web application providing the complete civics practice experience.

**Key Features:**
- Interactive quiz interface with keyboard navigation
- Dark/light mode support
- Progress tracking and statistics
- Mobile-responsive design
- Static deployment ready

**Quick Usage:**
```bash
cd website
npm run dev
# Visit http://localhost:3000
```

[→ Full Documentation](./website/README.md)

## 🛠️ Development

### Workspace Commands

```bash
# Install dependencies for all packages
npm install

# Build all packages
npm run build

# Test all packages
npm test

# Lint all packages
npm run lint

# Clean all packages
npm run clean
```

### Individual Package Development

```bash
# Work on specific package
npm run dev --workspace=website
npm run test --workspace=civics2json
npm run build --workspace=questionnaire
```

### Technology Stack

- **Language**: TypeScript with strict configuration
- **Architecture**: Effect-TS functional programming patterns
- **CLI**: @effect/cli for command interfaces
- **Web**: Next.js 15 with App Router
- **Styling**: Tailwind CSS v4
- **Testing**: Jest with comprehensive test coverage
- **Build**: npm workspaces with individual package builds

## 📊 Data Sources

### Official Government Sources

- **USCIS** - Civics test questions and updates
- **Senate.gov** - Current US Senators (XML feed)
- **House.gov** - Current US Representatives (HTML scraping)
- **USA.gov** - State government links for governor information
- **State Websites** - Individual state government pages

### Data Processing

- **Schema Validation** - Runtime type checking with Effect schemas
- **Error Handling** - Comprehensive error reporting and recovery
- **Caching Strategy** - Local file caching to minimize external requests
- **Update Tracking** - Monitors USCIS test changes and updates

## 🎮 Usage Examples

### Complete Data Pipeline

```bash
# Generate fresh dataset from all government sources
cd packages/civics2json
npx tsx src/index.ts questions construct

# Enhance with distractors
cd ../distractions
npx tsx src/cli/index.ts

# Test with CLI game
cd ../questionnaire  
npx tsx src/cli/index.ts --state NY

# Launch web interface
cd ../website
npm run dev
```

### Programmatic Usage

```typescript
import { Effect } from 'effect'
import { GameService, QuestionDataService } from 'questionnaire'
import type { GameSettings } from 'questionnaire'

const program = Effect.gen(function* () {
  const gameService = yield* GameService
  const questionData = yield* QuestionDataService
  
  const settings: GameSettings = {
    maxQuestions: 10,
    winThreshold: 6,
    userState: 'CA'
  }
  
  const { session, questions } = yield* gameService.createGameSession(settings)
  return { session, questions }
})

// Run with service layers
await Effect.runPromise(
  Effect.provide(program, [
    GameService.Default,
    QuestionDataService.Default
  ])
)
```

## 🧪 Testing

Each package includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Test specific packages
npm test --workspace=civics2json
npm test --workspace=questionnaire

# Coverage reports
npm run test:coverage --workspace=website
```

### Test Architecture

- **Effect Test Layers** - Mock services for isolated testing
- **Integration Tests** - Complete data pipeline validation
- **Service Testing** - Individual service logic verification  
- **Component Testing** - React component behavior and accessibility

## 📈 Quality Metrics

### Code Quality
- **TypeScript Strict Mode** - Complete type safety
- **ESLint + Prettier** - Consistent code formatting
- **Effect-TS Patterns** - Functional programming best practices
- **Comprehensive Testing** - High test coverage across all packages

### Performance
- **Bundle Optimization** - Minimal production builds
- **Static Generation** - Fast loading web interface
- **Efficient Caching** - Smart data fetching strategies
- **Effect Composition** - Optimized async operations

### Accessibility
- **WCAG 2.1 Compliance** - Web interface accessibility
- **Keyboard Navigation** - Complete keyboard support
- **Screen Reader Support** - Comprehensive ARIA implementation
- **Mobile Responsive** - Cross-device compatibility

## 🚀 Deployment

### Web Application

The website is configured for static deployment:

```bash
cd website
npm run build
npm run export
# Deploy dist/ directory to hosting provider
```

### CLI Tools

CLI tools can be used directly with npx:

```bash
# From any package directory
npx tsx src/index.ts [command]
npx tsx src/cli/index.ts [options]
```

### Docker Support

```bash
# Build Docker image (if Dockerfile is added)
docker build -t civics100 .
docker run -p 3000:3000 civics100
```

## 🤝 Contributing

### Development Workflow

1. **Fork and clone** the repository
2. **Create a branch** for your feature
3. **Follow coding standards** - Effect-TS patterns, TypeScript strict mode
4. **Write tests** for new functionality  
5. **Update documentation** as needed
6. **Submit a pull request**

### Code Standards

- **Effect-TS Architecture** - Use service patterns and dependency injection
- **TypeScript Strict** - Full type safety with no any types
- **Functional Programming** - Pure functions and immutable data
- **Comprehensive Testing** - Test all new functionality
- **Clear Documentation** - Update READMEs and inline docs

### Adding New Features

1. **Identify the appropriate package** for your feature
2. **Follow existing patterns** in that package
3. **Add service layers** for new functionality
4. **Include test coverage** with Effect test layers
5. **Update integration points** with other packages

## 📄 Educational Philosophy

civics100 promotes genuine civic knowledge through:

- **Official Sources** - All data from authoritative government websites
- **Adaptive Learning** - Questions adjust based on user performance
- **Quality Distractors** - Incorrect answers that test real understanding
- **Progressive Difficulty** - Appropriate challenge levels for learning
- **Comprehensive Coverage** - Complete USCIS test preparation

## 🔧 Configuration

### Environment Variables

Most packages run without environment variables. For development:

```bash
# Optional: Enable debug logging
DEBUG=civics*

# Optional: Custom data URLs (advanced)
USCIS_QUESTIONS_URL=https://custom-source.com
```

### Package Configuration

Each package includes configurable options:
- **civics2json** - Data source URLs and cache settings
- **distractions** - Quality thresholds and distractor pools
- **questionnaire** - Game settings and question selection  
- **website** - Design tokens and feature toggles

## 📋 Troubleshooting

### Common Issues

**Missing Question Data:**
```bash
# Ensure civics2json has generated data
cd packages/civics2json
npx tsx src/index.ts questions construct
```

**Build Errors:**
```bash
# Clean and reinstall all packages
npm run clean
npm install
npm run build
```

**CLI State Errors:**
```bash
# Use valid 2-letter state abbreviations
npx tsx src/cli/index.ts --state CA  # ✓ Valid
npx tsx src/cli/index.ts --state California  # ✗ Invalid
```

**Web Development Server Issues:**
```bash
cd website
npm run clean
npm install  
npm run dev
```

## 📚 Documentation

- **Package READMEs** - Detailed documentation for each package
- **API Documentation** - TypeScript interfaces and service definitions
- **Architecture Docs** - Design decisions and patterns
- **Contributing Guide** - Development workflow and standards

## 📞 Support

- **Issues** - [GitHub Issues](https://github.com/your-username/civics100/issues)
- **Discussions** - [GitHub Discussions](https://github.com/your-username/civics100/discussions)  
- **Documentation** - Package-specific READMEs and inline documentation

## 🙏 Acknowledgments

- **USCIS** - Official civics test questions and materials
- **US Government** - Open data sources (Senate, House, state websites)
- **Effect-TS Community** - Functional programming framework
- **Next.js Team** - React framework and tooling
- **Open Source Contributors** - Everyone helping improve civic education

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for civic education and US citizenship preparation.**