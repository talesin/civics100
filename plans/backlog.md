# Backlog

Low priority items from completed plans. These are nice-to-have improvements that don't affect functionality.

## Theme Consolidation

| Item | Description | Scope |
|------|-------------|-------|
| DistrictSelector colors | Move `districtThemeColors` from DistrictSelector.tsx to TamaguiProvider.tsx `themeColors` object | ~30 lines added to theme, ~25 lines removed from component |
| ErrorBoundary dark mode | Add CSS custom properties in globals.css for ErrorBoundary colors that respond to `prefers-color-scheme` | ~25 lines in globals.css |

### Notes

- OfflineIndicator amber warning colors intentionally left as-is (distinct from theme for visibility/urgency)
- InstallPrompt already correctly uses `themeColors` from context

## Code Review Deferred Items

| Item | Description | Notes |
|------|-------------|-------|
| SessionService Effect.runSync | Convert `Effect.runSync` calls in SessionService.ts (lines 38, 47) to async pattern | Low risk - underlying operations are synchronous. Would require API changes. |
| Remaining localStorage access | TamaguiProvider theme storage and game keyboard help flag use direct localStorage | TamaguiProvider runs before service provider context; simple values don't need Schema validation |
