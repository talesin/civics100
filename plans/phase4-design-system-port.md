# Phase 4 Execution Plan — Port design system to Tamagui tokens

## Context

Phase 4 of the React Native port (`plans/react-native-mobile-app.md`): the website's design system is expressed as CSS custom properties (`var(--editorial-*)` etc.) in inline styles on raw `<div>`s — unportable to React Native. This phase converts every shared-bound component to Tamagui tokens/theme keys while keeping the website **visually identical**, gated by a Playwright screenshot suite whose baseline is captured **before** any conversion. Phase 5 then moves the converted components into `packages/app`.

**User decisions:** (1) Relaunch sandbox with `--allow-git-writes`; one commit per batch (user confirms each commit). (2) Convert ALL CSS vars (`--editorial-*` AND `--theme-*`/`--color-*`/`--shadow-*`) in shared-bound files — exception: `--font-family-serif` stays a literal string until Phase 5 wires `createFont`.

**Prerequisite:** user relaunches with `./claude-sandbox.sh --allow-git-writes` before execution starts.

## Established facts (from exploration)

- 160 `var(--editorial-*)` + 65 non-editorial vars across 12 shared-bound tsx files. Web-only keepers: `InstallPrompt`, `OfflineIndicator` (keep their vars; their `--editorial-*`/`--theme-*` definitions in CSS must NOT be deleted).
- Four usage patterns: module-scope `React.CSSProperties` consts (Layout: 17); fully-inline `style={{}}` (bulk — settings 49 sites, page.tsx 35, results 27); vars as **props** (lucide `color=` 11 sites, SVG stroke/fill, `GameResults.tsx:205-216` helpers returning `'var(--theme-error)'` strings); runtime `<style>` injection + `onMouseOver` mutation (QuestionStatisticsTable hover, SpeakerButton keyframes, ErrorBoundary).
- `packages/app/src/tamagui.config.ts`: editorial tokens exist but **light values only**; light/dark themes have NO editorial keys (`$editorialInk` is light-locked today); no `editorialAccentSubtle` token; no `fonts` key. Dark editorial values live only in `website/src/styles/design-tokens.css` `html.t_dark` block (ink `#e2e8f0`, paper `#0f172a`, rule `#1e293b`, muted `#94a3b8`, accent `#93c5fd`, accent-subtle `rgba(30,58,138,0.25)`; light accent-subtle `#eff6ff`).
- Zero `$editorial*` references in website today → adding theme keys is provably zero-diff.
- Theme mechanism: `@tamagui/next-theme` puts `t_dark` on `<html>` pre-hydration (storageKey `'theme'`); `TamaguiProviderCore` has `disableRootThemeClass`; Tamagui's generated theme CSS keys off the **same** `.t_dark` class → **keep the provider stack unchanged**; only the value source moves from design-tokens.css to Tamagui theme CSS.
- Playwright: `website/playwright.config.ts`, 3 functional tests, **chromium only installed** (use `--project=chromium`), no visual testing exists yet. `e2e/*-snapshots/` is committable.
- framer-motion only in `app/page.tsx` (7 `motion.div`) — **keep in Phase 4**, moti swap is Phase 5. `.animate-fade-in` used only in game/page.tsx; other `.animate-*` classes dead. `game/page.tsx:77` references undefined `pulse` keyframes (existing bug — delete).
- Brittle Jest assertions: `test/components/ThemeToggle.test.tsx` (`.theme-icon-*` classes, `tagName==='BUTTON'`, 2 svgs), `test/components/GameResults.test.tsx` (`toHaveStyle({width:'75%'})`).
- Carry-forwards: no new `packages/app` exports subpaths needed this phase; never add `./animations` subpath; source-shipped package; tamagui pinned 1.144.4.

## Key design decisions

1. **Theme keys named `editorial*`** (1:1 with CSS vars, greppable): add tokens `editorialInkDark/PaperDark/RuleDark/MutedDark`, `editorialAccentSubtle` (#eff6ff), `editorialAccentSubtleDark`; add 6 `editorial*` keys to BOTH `lightTheme`/`darkTheme`. Components use `$editorialInk` etc. only via theme-resolving props — never raw hex. Non-editorial `--theme-*` vars map to the **existing** theme keys (`error`, `success`, `warning`, `background`, `primary`…); add missing ones (e.g. `errorBg`, `successBg`, `purple`, `cardBg`, `backgroundHover`) to both themes as needed, sourcing dark values from design-tokens.css.
2. **Pattern handling:** consts → `styled(YStack/XStack/Text)`; inline styles → Tamagui components with inline `$token` props (promote to `styled()` when repeated ≥3×; wrap raw text in `<Text>` now); vars-as-props → `useTheme().editorialMuted?.get()` (works on web = CSS var string, native = raw value); GameResults helpers return theme **key names**, resolved at call sites via `useTheme()`; hover `<style>`/mouse mutation → `hoverStyle`; SpeakerButton keyframes → web-only class in globals.css (colors tokenized now, moti in Phase 5); 4 inline spinners → one shared website-local `LoadingSpinner`.
3. **Provider stack untouched** (`NextThemeProvider` + `disableRootThemeClass` is the documented SSR pattern). ThemeToggle keeps the dual-icon CSS visibility hack (SSR-flash-free, web-only), converts button/colors to Tamagui with `tag="button"`.
4. **Serif font deferred:** keep `fontFamily: 'var(--font-family-serif)'` literal strings; tag all 16 sites `// PHASE5: $fontFamily`; no `fonts` key this phase (global CSS-output parity risk).
5. **Visual harness:** separate `playwright.visual.config.ts`, prod server (`next build && next start` on port 3101), chromium, `toHaveScreenshot` with `maxDiffPixels: 100, threshold: 0.2, animations: 'disabled', caret: 'hide'`; matrix = 5 routes × {light,dark} × {1280×720, 390×844} = 20 shots; seeded localStorage (`theme` key + LocalStorageService keys for /game /results /statistics with fixed dates) via `addInitScript`; settle helper (`document.fonts.ready` + framer-motion opacity wait). Baselines committed, tag `phase4-baseline`. Baselines valid only in this container's font stack — never `--update-snapshots` elsewhere.

## Stages (one commit each, user confirms; full gate = lint + root `npm test` + visual suite; heavier gates noted)

**Stage 0 — Visual harness + baseline.** New: `website/playwright.visual.config.ts`, `website/e2e/visual/routes.spec.ts` (+ seed/settle helpers), `test:visual`/`test:visual:update` scripts in `website/package.json`. Verify: suite green **twice consecutively** (determinism proof); commit 20 PNGs; tag `phase4-baseline`.

**Stage 1 — Theme wiring.** `packages/app/src/tamagui.config.ts` only (new tokens + theme keys, incl. the non-editorial additions). Verify: visual **zero diff**; `apps/mobile` `tsc --noEmit` + `npx expo export` (shared config!); root `npm test`; website `next build`.

**Stage 2 — Layout.tsx + ThemeToggle (+ ThemeToggle.test.tsx).** 17 consts → styled defs; keep `next/link`, `.skip-link`, `.container`, `.md:flex` classes. Visual gate covers all routes (global chrome) — check dark.

**Stage 3 — Editorial primitives (zero-diff expected).** `website/src/components/tamagui/Button.tsx` gains `editorial`/`editorialGhost` variants (from `.btn-editorial*` CSS); new `EditorialInput.tsx` (from `.input-editorial`); new `LoadingSpinner.tsx`; update `tamagui/index.ts`.

**Stage 4 — Leaf batch 1: ErrorBoundary, DistrictSelector, QuestionDetailModal.** Covers hover-mutation → `hoverStyle`, SVG via `useTheme()`, removal of hybrid `style={{var}}` on Tamagui components. Per-file `grep -c 'var(--' ` → 0.

**Stage 5 — Leaf batch 2: StatsSummary (+ `.stats-strip` → per-cell borders + media props), QuestionStatisticsTable (hover injection → `hoverStyle`; `.accuracy-*`/`.prob-*` → variant maps), SpeakerButton.** Watch the 390px stats-strip shots.

**Stage 6 — Pages: statistics/page.tsx, results/page.tsx** (progress-circle SVG via `useTheme`; `.badge` → styled variants; spinners → LoadingSpinner).

**Stage 7 — Pages: game/page.tsx + settings/page.tsx.** `.animate-fade-in` → `enterStyle` + `animation`; delete dead `pulse` ref; `.answer-btn` → styled `AnswerButton` variant replacing `getAnswerButtonClass()` (with GameQuestion if that's where it lives); settings adopts EditorialInput — mind the radio/checkbox `all:unset` fixes in globals.css.

**Stage 8 — app/page.tsx + GameResults.** Home: keep `motion.div` wrappers, convert styling inside them. GameResults helpers → theme key names; fix `GameResults.test.tsx` width assertion if the compiler extracts to class (fallback: assert `aria-valuenow`/data-attr).

**Stage 9 — CSS trim + exit gate.** Delete from `globals.css`/`design-tokens.css` only classes with zero remaining consumers (`.animate-*` dead set, `.answer-btn`, `.badge`, `.accuracy-*/.prob-*`, `.stats-strip`, `.btn-editorial*`, `.input-editorial`, `.theme-icon-*` stays if hack retained). **Keep:** all `--editorial-*`/`--theme-*` var definitions (InstallPrompt/OfflineIndicator consume them), `--font-*`, `.focus-ring`, `.sr-only`, `.skip-link`, `.container`, `.hidden`/`.md:*`, print/reduced-motion/contrast queries, Tamagui-clobber fixes (`p,li` display; radio/checkbox). Exit gate: `grep -rn 'var(--' website/src --include='*.tsx'` hits only InstallPrompt/OfflineIndicator/`--font-family-serif` sites; full suite: lint, root `npm test`, `next build`, functional e2e `--project=chromium`, visual, mobile `tsc` + `expo export`.

**Stage 10 — Docs + plan status.** Update `docs/react-guide.md` + root `CLAUDE.md` Tamagui sections (currently recommend the old CSS-var approach; also fix stale `@/context/ThemeContext` pointer); save this execution plan to `/workspace/plans/` (project convention); add Phase 4 STATUS block to `plans/react-native-mobile-app.md` with carry-forwards: Phase-5 `createFont` obligation + 16 tagged font sites, SpeakerButton keyframes → moti, LoadingSpinner → Tamagui `Spinner`, ThemeToggle native needs state-based render, icon color props ready for `@tamagui/lucide-icons` swap.

## Risks

1. **YStack/XStack ≠ div** (flex-column default, no margin collapse, text baselines) — subtle layout shifts; caught by per-batch 2-viewport visual gate; wrap text in `<Text>` deliberately.
2. **Specificity flips** (inline style → atomic classes vs globals.css resets) — highest in settings inputs (Stage 7).
3. **framer-motion flake** on home shots — settle helper; `mask` hero as last resort.
4. **`useTheme().get()` under css driver** returns `var(--...)` string — verify lucide/SVG acceptance once in Stage 4 (chromium-only, low risk).
5. **Coexistence window** (converted components on Tamagui theme CSS, unconverted on design-tokens.css) is safe — both key off `.t_dark`, values identical by construction; a typo'd dark token shows in Stage 1/2 dark shots.
6. **Brittle Jest assertions** — fixed in the same commit as their component (Stages 2, 8).

## Verification summary

- Per batch: `npm run test:visual -w website` (20-shot diff vs committed baseline) + root `npm test` + website lint.
- Stage 1 & 9 additionally: `apps/mobile` `tsc --noEmit` + `npx expo export` (shared config), website `next build`, functional e2e `npx playwright test --project=chromium`.
- Exit: zero `var(--` in shared-bound tsx (grep), all gates green, Phase 4 STATUS written.
