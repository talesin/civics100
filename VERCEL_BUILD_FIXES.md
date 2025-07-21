# Vercel Build Fixes for Monorepo

## Issues Resolved

The Vercel build was failing due to monorepo workspace dependency resolution issues. The following changes fix these problems:

## Changes Made

### 1. Next.js Configuration (`website/next.config.ts`)
- Added `transpilePackages: ['civics2json', 'questionnaire']` to handle workspace dependencies
- Added `experimental.externalDir: true` to allow importing from parent directories
- Removed problematic next-transpile-modules plugin

### 2. Vercel Configuration (`vercel.json`)
- Created root-level vercel.json to specify build commands and output directory
- Configured proper monorepo build process:
  - `buildCommand`: `cd website && npm run build`
  - `outputDirectory`: `website/dist`
  - `installCommand`: `npm install` (installs from root to maintain workspace structure)

### 3. Local Build Simulation Scripts (`website/package.json`)
- Added `vercel-build-local`: Simulates exact Vercel build process locally
- Added `vercel-simulate`: Alternative simulation with npm ci for testing

## Local Testing
Run these commands to test Vercel build locally:

```bash
# Simulate Vercel build process exactly
npm run vercel-build-local

# Alternative simulation with clean install
npm run vercel-simulate
```

## Build Process Flow
1. Root level: `npm install` (installs all workspace dependencies)
2. Website directory: `npm run lint && npm run test && next build`
3. Next.js transpiles workspace packages during build
4. Output goes to `website/dist/`

## Key Fixes
- ✅ Workspace dependencies (`civics2json`, `questionnaire`) are properly transpiled
- ✅ Monorepo structure is maintained during build
- ✅ Build process can be simulated locally for debugging
- ✅ All tests and linting pass
- ✅ Static export works correctly

The Vercel deployment should now succeed with these configurations.