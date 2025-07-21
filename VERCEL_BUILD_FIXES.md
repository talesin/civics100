# Vercel Build Fixes for Monorepo

## Issues Resolved

The Vercel build was failing due to:
1. Incorrect build directory configuration (trying to `cd` into non-existent directory)
2. Monorepo workspace dependency resolution issues

## Changes Made

### 1. Next.js Configuration (`website/next.config.ts`)
- Added `transpilePackages: ['civics2json', 'questionnaire']` to handle workspace dependencies
- Added `experimental.externalDir: true` to allow importing from parent directories
- Removed problematic next-transpile-modules plugin

### 2. Vercel Configuration (`website/vercel.json`)
- **FIXED**: Moved vercel.json INTO the website directory (not at root)
- Configured proper monorepo build process from within website context:
  - `installCommand`: `cd .. && npm install` (install workspace deps from parent)  
  - `buildCommand`: `npm run build` (standard Next.js build within website dir)
  - `outputDirectory`: `dist` (relative to website directory)

### 3. Vercel Project Settings (Alternative Configuration)
If vercel.json doesn't work, configure these settings in Vercel Dashboard:
- **Root Directory**: Set to `website` 
- **Build Command**: `npm run build`
- **Install Command**: `cd .. && npm install`
- **Output Directory**: `dist`
- **Node.js Version**: 20.x or 22.x (latest)

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

## Build Process Flow (Corrected)
1. **Vercel Context**: Build runs from within `website/` directory (not repo root)
2. **Install Step**: `cd .. && npm install` (installs workspace dependencies from parent)
3. **Build Step**: `npm run lint && npm run test && next build` (within website directory)
4. **Transpilation**: Next.js transpiles workspace packages during build  
5. **Output**: Goes to `website/dist/` (relative to build context)

## Key Fixes
- ✅ **CRITICAL**: Fixed directory context - build runs from website/ not root
- ✅ **CRITICAL**: Install command properly handles workspace dependencies  
- ✅ Workspace dependencies (`civics2json`, `questionnaire`) are properly transpiled
- ✅ Monorepo structure is maintained during build
- ✅ Build process can be simulated locally for debugging
- ✅ All tests and linting pass
- ✅ Static export works correctly

## What Was Wrong Before
- ❌ Root-level vercel.json tried to `cd website` from repo root
- ❌ Vercel couldn't find `website` directory (wrong build context)
- ❌ Build commands were running from wrong directory

## What's Fixed Now  
- ✅ vercel.json is inside website/ directory (correct build context)
- ✅ Install command goes up one level to maintain workspace structure
- ✅ Build command runs standard Next.js process from correct location

The Vercel deployment should now succeed with the corrected configuration.