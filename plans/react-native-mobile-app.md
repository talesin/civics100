# React Native (Expo) Mobile App — Phased Plan

## Context

The repo (`civics100`) is an npm-workspace monorepo whose user-facing app is `website` — a Next.js 16 + React 19 + **Tamagui** practice-test app for the USCIS civics exam. We want to ship the same app on **iOS and Android** as a native app.

This is far more tractable than a typical web→native port because the groundwork is already laid:

- **All game logic is platform-agnostic.** `civics2json` (data), `distractions` (distractor answers), and `questionnaire` (Effect-TS game engine: `GameService`, session state machine, scoring) are pure TS packages the UI merely consumes.
- **The UI already uses Tamagui** (`website/tamagui.config.ts`), which compiles to React Native primitives natively and HTML on web. Tokens, light/dark themes, and media queries already exist.
- **Services are already Effect `Layer`s.** `LocalStorageService` isolates every `localStorage` call behind helpers and already ships a swappable `TestLocalStorageServiceLayer` — proving per-platform layer swapping is trivial. `ServiceProvider.ts` is the single injection seam.

The web coupling that must be abstracted is the boundary layer only: Next routing, `localStorage`, `speechSynthesis`/Web-Audio, service worker/PWA, `next/font`, `lucide-react`, `framer-motion`, and — the largest item — a design system currently expressed as raw CSS variables (`var(--editorial-*)`) in inline styles across 12 files (158 occurrences; concentrated in `app/page.tsx`, `settings/page.tsx`, `StatsSummary.tsx`, `results/page.tsx`, `Layout.tsx`).

**Decisions made (by the user):** (1) Extract a shared `packages/app` consumed by both web and mobile — Tamagui's `apps/* + packages/app` pattern. (2) **Full parity** — all 5 screens. (3) **Expo** (managed + dev builds) with **expo-router**. (4) **Minimize website changes** — the website re-points imports to the shared package and keeps working; no rewrite.

Intended outcome: one shared UI/logic package, an Expo app that builds to iOS/Android at full feature parity, and a website that looks and behaves identically while now sourcing its UI from `packages/app`.

> Validated against the reference docs (mounted at `/references` in this environment — `tamagui`, `react-and-react-native`, `effect`, `playwright`, and the new **`expo` SDK 56 guide set**) and the live `/workspace` source. The monorepo pattern, dual-toolchain shared config, `.web/.native` driver split, expo-router, AsyncStorage, dev-build requirement, EAS, and reanimated-plugin-last rule are all confirmed; the numbers, the `@tamagui/metro-plugin` step, the icon peer dep, the v1↔v2 animation-package naming, the SDK target, and the Hermes proof obligation below reflect that validation pass.

### Expo Reference Guides

Authoritative source for every Expo claim below is the SDK 56 guide set at
`/references/expo/` ([index](/references/expo/index.md)). Most-cited chapters:
core model & CNG (Ch 01), getting started (Ch 02), app config + metro/babel (Ch 03),
config plugins (Ch 04), expo-router (Ch 06–08), dev builds (Ch 09), UI/assets (Ch 10),
monorepos/new-arch/deep-linking (Ch 11), SDK packages (Ch 12–15), EAS (Ch 16–19).
Inline citations below use the form `[Ch NN § Title](/references/expo/NN-file.md#anchor)`.

## Target Architecture

```
.                              # repo root
  package.json                 # workspaces: ["packages/*", "apps/*", "website"]
  packages/
    civics2json/ distractions/ questionnaire/   # unchanged
    app/                                          # NEW: shared UI + logic
      src/
        tamagui.config.ts
        animations.web.ts  animations.native.ts  # platform-split driver
        components/   # platform-neutral Tamagui components (ported from website)
        screens/      # Home, Game, Results, Settings, Statistics
        services/     # tags + schemas + web/native layers + makeAppServiceLayer
        hooks/        # platform-neutral hooks only
  apps/
    mobile/                                        # NEW: Expo app
      app/            # expo-router routes = thin wrappers over screens
      metro.config.js  babel.config.js  app.config.ts  eas.json
  website/                                         # MINIMAL changes
    next.config.ts    # transpilePackages += "app"
    src/app/*         # routes become thin wrappers over packages/app screens
    src/components/   # KEEP web-only: OfflineIndicator, InstallPrompt, ServiceWorkerRegistration
```

**Platform-abstraction pattern:** one Effect tag per capability, two `Layer`s, composed per app via a `makeAppServiceLayer(platformLayers)` factory in `packages/app` (generalizing the current `AppServiceLayer`):

| Capability | Web layer | Native layer |
| --- | --- | --- |
| `LocalStorageService` (tag + Schemas shared) | `localStorage` | `@react-native-async-storage/async-storage` ([Ch 14](/references/expo/14-sdk-data-auth-background.md#async-storage)) |
| `TtsService` | `speechSynthesis` | `expo-speech` ([Ch 13](/references/expo/13-sdk-device-sensors-system.md#speech)) |
| `SoundService` | Web Audio | `expo-audio` ([Ch 12](/references/expo/12-sdk-camera-media-graphics.md#audio) — current API; `expo-av` superseded) |
| `NavigationService` | `next/navigation` / `next/link` | `expo-router` ([Ch 06](/references/expo/06-expo-router-basics.md#navigation)) |

Screens stay router-agnostic by receiving navigation via `NavigationService`/callback props — neither router leaks into `packages/app`.

## Library Choices

- **Target the latest stable Expo SDK.** ✅ LOCKED in Phase 0 (2026-06-29): **Expo SDK 56.0.12 → React Native 0.85.3, React 19.2.3**, New Architecture on, Hermes default. (The earlier "≥54 floor / not RN 0.79" guidance is superseded by this locked matrix — full list in `spikes/mobile/GO-NO-GO.md` §4.) Note RN 0.85 ships **reanimated 4**, which requires a separate `react-native-worklets` dep and moves its babel plugin to `react-native-worklets/plugin`. Pin mobile React to the SDK's required version; `packages/app` declares `react` as a permissive **peerDependency** (not a hard dep) so web and native bundle their own copy. (SDK/workflow model: [Ch 01 § Workflows](/references/expo/01-overview-and-core-concepts.md#workflows); New Architecture: [Ch 11 § New Architecture](/references/expo/11-common-guides.md#new-architecture); reanimated 4 / worklets: [Ch 15 § Reanimated](/references/expo/15-sdk-ui-components.md#reanimated).)
- **Pin `tamagui` / `@tamagui/*` to the exact website version (`1.144.x`)** across `packages/app`, `website`, `apps/mobile` to avoid "two Tamagui instances" runtime errors. Include `@tamagui/metro-plugin` in this pinned set (see Phase 1).
- **Animations:** `@tamagui/animations-css` (web) / `@tamagui/animations-moti` + `react-native-reanimated` + `moti` (native), behind the `animations.web.ts`/`animations.native.ts` split. Note: the package is `@tamagui/animations-moti` on the pinned **v1.144** line; it was renamed `@tamagui/animations-motion` in Tamagui **v2** — rename only if/when the Tamagui upgrade happens. `@tamagui/animations-reanimated` is the non-Moti native fallback if Moti proves troublesome.
- **Icons:** `@tamagui/lucide-icons` (cross-platform, themed) replacing `lucide-react`. Requires the `react-native-svg` peer on native (`react-native-svg @tamagui/lucide-icons`) — [Ch 12 § SVG](/references/expo/12-sdk-camera-media-graphics.md#svg).
- **Animation in components:** `moti` replacing `framer-motion`.
- **Storage:** `@react-native-async-storage/async-storage` for v1 (async API maps onto existing Effect helpers; MMKV is a fast-follow only if profiling demands it). Confirmed appropriate for non-sensitive app state in [Ch 14 § AsyncStorage](/references/expo/14-sdk-data-auth-background.md#async-storage); the `expo-sqlite`/`kv-store` drop-in is the documented migration path if profiling demands it ([Ch 14 § SQLite](/references/expo/14-sdk-data-auth-background.md#sqlite)).
- **Fonts:** `expo-font` replacing `next/font` — [Ch 10 § Fonts](/references/expo/10-ui-and-assets.md#fonts).
- **TTS (mobile):** `expo-speech` — [Ch 13 § Speech](/references/expo/13-sdk-device-sensors-system.md#speech). Confirms the voice-enumeration caveat: `getAvailableVoicesAsync()` returns a platform- and language-pack-dependent list, so ship default voice + rate first (full picker is fast-follow).
- **Sound (mobile):** `expo-audio` — [Ch 12 § Audio](/references/expo/12-sdk-camera-media-graphics.md#audio). This is the current SDK 56 audio API (the older `expo-av` is superseded), which resolves the plan's only open library question.

## Phased Implementation

### Phase 0 — De-risk spikes (no committed app code)
- **Spike A (Metro + Effect on Hermes):** throwaway Expo app imports from `questionnaire/data` and runs a **non-trivial Effect — including a Schema decode — on a Hermes device/sim**, not just at bundle time. The Effect references document only `@effect/platform-{node,bun,browser}` and say nothing about React Native/Hermes, so "Effect core is Node-free → runs on Hermes" is a reasonable but *undocumented* assumption that must be proven on-device. Also confirm Metro does **not** pull in `@effect/platform-node` / `@effect/cli` (Node-only deps in `packages/questionnaire/package.json`). The website already runs `questionnaire` in-browser, so a Node-free path exists — confirm it's Metro-resolvable; if `.` is contaminated, plan a `questionnaire` export-map refinement.
- **Spike B (Tamagui dual toolchain):** confirm one `tamagui.config.ts` compiles under both `@tamagui/next-plugin` and the Tamagui babel plugin (+ `@tamagui/metro-plugin`) with the driver split.
- Lock the exact Expo SDK ↔ RN ↔ React version matrix (target the latest stable SDK; do not assume 53/RN-0.79).
- **Exit:** written go/no-go on `questionnaire` RN-safety, proven by an Effect+Schema run executing on Hermes, plus pinned versions.

#### Phase 0 — STATUS (updated 2026-06-29): ⚠️ CONDITIONAL GO — in-container work complete, one device-only gate remains

Executed in a Linux **aarch64** container (no Xcode/Android SDK/simulators). Full results
+ carry-forward findings in `spikes/mobile/GO-NO-GO.md`. Summary:

- ✅ **Matrix locked (0a):** Expo **SDK 56.0.12**, RN **0.85.3**, React **19.2.3**,
  reanimated **4.3.1** + worklets **0.8.3** (new), moti 0.30, async-storage 2.2.0,
  svg 15.15.4, expo-router 56.2.11, speech/audio/font 56.x, tamagui pinned 1.144.4.
- ✅ **Spike A bundle contamination (0b):** `metro build` produces a 4.65 MB bundle with
  **0** hits for `@effect/platform-node` / `@effect/cli` / Node built-ins; real data +
  276 Schema symbols present. The Node-only deps are isolated to
  `questionnaire/dist/src/cli/index.js` (off the `.`/`./data` graph). RN-safe.
- ⚠️ **Spike A Hermes exec (0c):** the exact Effect+Schema+`loadQuestions` graph runs
  correctly under Node/V8 (`spikes/mobile/headless-probe.mjs` → decode Q#1, TOTAL 128,
  3 paired/4 options). Genuine on-**Hermes** execution is deferred to the device gate
  (no aarch64-Linux Hermes VM exists here); residual risk LOW.
- ✅ **Spike B Tamagui (0d/0e):** split `tamagui.config.ts` compiles **native** under
  Metro (`@tamagui/babel-plugin` + metro-plugin), single `tamagui@1.144.4` instance, and
  the **website still builds** (all 5 routes).
- ⏸ **REMAINING GATE (0f) — DEVICE ONLY:** on iOS sim + Android emulator confirm Tamagui
  primitives render, the moti/reanimated-4 native animation plays, and the three Spike-A
  probes go green on real Hermes. Run `npx expo run:ios` / `run:android` from the spike on
  a Mac. This is the only thing blocking full Phase-0 sign-off.

**Phase-1 carry-forward (critical, details in GO-NO-GO.md):** (1) reanimated 4 ⇒ babel
plugin is `react-native-worklets/plugin` + a `react-native-worklets` dep. (2) Tamagui's
`react-dom@19.2.7` peer floor ⇒ install with `--legacy-peer-deps`. (3) Metro
`unstable_enablePackageExports = true` is REQUIRED (questionnaire → `civics2json/Questions`
subpath). (4) **`expo export` fails to resolve effect's `.` export while `metro build`
succeeds** — Phase 1 must retest `expo export` on the in-workspace app and add a
`resolveRequest` shim for `effect` if it still fails (most likely friction point).

### Phase 1 — Scaffold `apps/mobile`
- Add `apps/*` to root `workspaces` (`package.json`, currently `["packages/*","website"]`). Create `apps/mobile`.
- `metro.config.js`: wrap the config with `@tamagui/metro-plugin`'s `withTamagui(config, { components: ['tamagui'], config: './tamagui.config.ts' })` (the documented Tamagui↔Metro integration, paired with the babel plugin), then layer the monorepo resolver settings on top: `watchFolders` → repo root, `resolver.nodeModulesPaths` → app + root (npm hoists), `resolver.unstable_enablePackageExports = true` (honor ESM `exports`). Monorepo Metro setup: [Ch 11 § Monorepos](/references/expo/11-common-guides.md#monorepos), [Ch 03 § Metro Config](/references/expo/03-app-configuration.md#metro-config).
- `babel.config.js`: `babel-preset-expo` + Tamagui plugin + the worklets/reanimated plugins **last** ([Ch 03 § Babel Config](/references/expo/03-app-configuration.md#babel-config)). **Correction (reanimated 4):** the plugin is now `react-native-worklets/plugin` (it must be the last entry), with `react-native-reanimated/plugin` no longer used standalone — per the Phase-0 carry-forward and [Ch 15 § Reanimated](/references/expo/15-sdk-ui-components.md#reanimated).
- `app.config.ts` (TypeScript dynamic config — [Ch 03 § Static Config](/references/expo/03-app-configuration.md#static-config)) with the required fields set up front: `name`, `slug`, `scheme`, `version`, `ios.bundleIdentifier`, `android.package`, `newArchEnabled: true`, and `experiments.typedRoutes: true`. Note `slug` / `bundleIdentifier` / `package` are effectively immutable after store submission, so fix them now. (`scheme` enables native deep links and `typedRoutes` gives type-safe `<Link href>` — [Ch 07 § Typed Routes](/references/expo/07-expo-router-advanced.md#typed-routes), [Ch 07 § Deep Linking](/references/expo/07-expo-router-advanced.md#deep-linking).)
- `plugins` array ([Ch 03 § Plugins](/references/expo/03-app-configuration.md#plugins), [Ch 04 § Using Plugins](/references/expo/04-config-plugins.md#using-plugins)): `expo-router`, `expo-build-properties` (new-arch), `react-native-svg`, and the reanimated/worklets plugin **last**. AsyncStorage needs no config plugin (autolinked).
- `tsconfig.json` extending root composite, expo-router ([Ch 06 § Installation](/references/expo/06-expo-router-basics.md#installation)) with one placeholder screen reading `questionnaire` data.
- **Expect the first run to be slow:** `expo run:ios|android` auto-runs prebuild (CNG, ~2–5 min on first invocation) to generate `ios/`+`android/`; later runs skip it unless native config changes ([Ch 01 § CNG](/references/expo/01-overview-and-core-concepts.md#cng), [Ch 09 § Creating a Dev Build](/references/expo/09-development-builds-and-debugging.md#creating-a-dev-build)). This is a **dev-client** build, not Expo Go ([Ch 09 § Dev Build vs Expo Go](/references/expo/09-development-builds-and-debugging.md#dev-build-vs-expo-go)).
- **Exit:** `expo run:ios` and `run:android` boot and render data; **`npx expo export` succeeds locally** (it exercises the same resolution path EAS uses — if effect's `.` export still fails, add the `resolveRequest` shim now, before EAS, per the Phase-0 carry-forward and [Ch 16 § eas.json](/references/expo/16-eas-build.md#eas-json)); website still builds untouched.

### Phase 2 — `packages/app` + shared Tamagui config
- Create `packages/app` (ESM, `dist/` build matching siblings, version `*`).
- **Move** `website/tamagui.config.ts` → `packages/app/src/tamagui.config.ts`; extract the animation driver to `animations.web.ts`/`animations.native.ts` (config imports `./animations`, resolved per platform). The `createTokens({color, space, size, radius, zIndex})` block (incl. editorial palette) is neutral and moves wholesale.
- Re-point `website` and `next.config.ts` `transpilePackages` (already lists Tamagui packages — add `app`) at the shared config.
- **Exit:** website renders byte-identical (visual diff on 5 screens); a `packages/app` Tamagui component renders in `apps/mobile`.

### Phase 3 — Platform abstraction (Effect service swap)
- Move neutral services into `packages/app/src/services`: `SessionService`, `QuestionDataService`, `StatisticsService`, `DistrictDataService` (all already wrap `questionnaire`/JSON).
- For coupled services keep one tag, two layers:
  - `LocalStorageService`: tag + Schemas → `packages/app`; web keeps current `localStorage` Default (`.web.ts`); add `.native.ts` over AsyncStorage (mechanical re-impl of the 13 already-isolated methods; Schema logic shared verbatim) — [Ch 14 § AsyncStorage](/references/expo/14-sdk-data-auth-background.md#async-storage).
  - New `TtsService` / `SoundService` tags: web layers lift logic from `useTextToSpeech`/`useGameSounds`; native layers wrap `expo-speech` ([Ch 13](/references/expo/13-sdk-device-sensors-system.md#speech)) / `expo-audio` ([Ch 12](/references/expo/12-sdk-camera-media-graphics.md#audio)).
  - `NavigationService`: thin tag/callbacks, implemented per app — no router in shared package. **Optional refinement (maintainer's call):** the guides show expo-router *is itself* the routing abstraction ([Ch 06 § Navigation](/references/expo/06-expo-router-basics.md#navigation)) and web uses Next.js regardless, so a full Effect-tag may be more indirection than the two-router split needs. A lighter alternative: keep screens router-neutral by passing nav **callbacks** (`onNext`, `onNavigate`) and let the thin route wrappers in `apps/mobile/app/*` and `website/src/app/*` import `expo-router` / `next/navigation` directly. Either way, no router leaks into `packages/app`.
- Generalize `ServiceProvider.ts`'s `AppServiceLayer` into `makeAppServiceLayer(platformLayers)` + move `runWithServices*` to `packages/app`.
- **Exit:** a shared save→read `GameResult` Effect passes against both web (jsdom) and native (`jest-expo` + AsyncStorage mock) layers; existing website Jest tests using `TestLocalStorageServiceLayer` still pass. (`jest-expo` is chosen over the references' default Vitest deliberately — it keeps parity with the existing Jest suites already aggregated by `npm run test --workspaces` and lets the native layer reuse `TestLocalStorageServiceLayer` verbatim.)

### Phase 4 — Port design system to Tamagui tokens (the long pole)
- Map every `var(--editorial-*)` usage to the matching `$editorial*` Tamagui token (the values already exist as tokens — this is a mapping, not a redesign).
- Drive `light`/`dark` via Tamagui themes, replacing the `html.t_dark` switch on both platforms.
- Convert the 12 files using `var(--...)` from raw `<div style>` to `<YStack/XStack/Text>` + `$token` props, starting with `Layout.tsx` and the `tamagui/` wrappers. Replace `.animate-*`/framer-motion with `moti`/Tamagui animations.
- Trim `globals.css`/`design-tokens.css` to genuinely web-only resets.
- **Exit:** zero `var(--editorial-*)` in components destined for `packages/app`; Playwright visual diffs of all 5 web routes within tolerance (baseline captured **before** this phase — the guardrail for decision #4).

### Phase 5 — Move components + screens into `packages/app`
- Least-coupled first: `tamagui/*` wrappers, `StatsSummary`, `GameResults`, `QuestionStatisticsTable`, `StateSelector`, `DistrictSelector`, `GameQuestion`, `GameControls`, `PoliticianVerificationBox`, `QuestionDetailModal`, `SpeakerButton`, `ThemeToggle`, `ErrorBoundary`. Swap icons to `@tamagui/lucide-icons`; route `Layout` nav through `NavigationService`.
- **Keep web-only in `website`:** `OfflineIndicator`, `InstallPrompt`, `ServiceWorkerRegistration`.
- Build 5 shared screen components in `packages/app/src/screens` (the ~580-line `/game` state machine → shared `GameScreen` taking nav callbacks — its size makes the shared extraction the highest-effort step of this phase). Web routes and `apps/mobile/app/*` become thin wrappers.
- **Exit:** every website route renders the shared screen; mobile mounts the same screens; `/game` behaves identically on both.

### Phase 6 — Native features & polish
- Wire native layers (AsyncStorage / `expo-speech` / `expo-audio`); `apps/mobile/app/_layout.tsx` tab/stack nav replacing the web header ([Ch 07 § Tabs](/references/expo/07-expo-router-advanced.md#tabs-navigator) / [§ Stack](/references/expo/07-expo-router-advanced.md#stack-navigator)); `expo-font` ([Ch 10 § Fonts](/references/expo/10-ui-and-assets.md#fonts)), safe-area ([Ch 10 § Safe Areas](/references/expo/10-ui-and-assets.md#safe-areas)), status/system bars ([Ch 10 § System Bars](/references/expo/10-ui-and-assets.md#system-bars)), splash/icon ([Ch 10 § Icon & Splash](/references/expo/10-ui-and-assets.md#icon-splash)), light/dark themes ([Ch 10 § Color Themes](/references/expo/10-ui-and-assets.md#color-themes)). Drop `useKeyboardNavigation` on mobile.
- **Add `expo-haptics`** (promoted from fast-follow — zero config, no plugin): tactile feedback on answer select/submit is an outsized polish win for a quiz, with graceful no-op when unsupported ([Ch 13 § Haptics](/references/expo/13-sdk-device-sensors-system.md#haptics)).
- **Add `expo-system-ui`**: set the root-view background color to eliminate the Android navigation-transition color flash ([Ch 15 § UI Components](/references/expo/15-sdk-ui-components.md)).
- **Exit:** all 5 screens fully functional on iOS sim + Android emulator with persistence, TTS, sounds, and haptic answer feedback.

### Phase 7 — Build, CI, release
- **EAS Build** (`eas.json`) dev/preview/production profiles with a dev-client (reanimated/async-storage/expo-audio aren't in Expo Go) — [Ch 16 § eas.json](/references/expo/16-eas-build.md#eas-json). Minimal skeleton:
  ```json
  {
    "cli": { "version": ">= 12.0.0" },
    "build": {
      "development": { "developmentClient": true, "distribution": "internal", "ios": { "simulator": true } },
      "preview": { "distribution": "internal" },
      "production": {}
    }
  }
  ```
  Signing/credentials are managed by EAS ([Ch 16 § Credentials](/references/expo/16-eas-build.md#credentials), [Ch 17 § App Signing](/references/expo/17-eas-submit-and-distribution.md#app-signing)). On EAS the monorepo installs from the root lockfile and resolves hoisted packages itself — the local `watchFolders`/`nodeModulesPaths` remapping is dev-only.
- **EAS Update (optional for v1):** setup is ~2 commands — `expo install expo-updates` then `eas update:configure` (writes `runtimeVersion`/channels) — so OTA hotfixes *can* land in v1 rather than waiting on a fast-follow retrofit ([Ch 18 § Publishing](/references/expo/18-eas-update.md#publishing)). Maintainer's call; see Fast-follow.
- Root scripts `dev:mobile`/`ios`/`android` (`dev`→website unchanged). Extend root `clean` to cover mobile artifacts. CI: `tsc --build`, `npm run test --workspaces`, EAS preview smoke build ([Ch 16 § CI](/references/expo/16-eas-build.md#ci); EAS Workflows is the native option — [Ch 19 § EAS Workflows](/references/expo/19-eas-workflows-hosting-insights.md#eas-workflows)).
- **Exit:** green CI; EAS preview build installs on a device.

## Key Files
- `package.json` — add `apps/*` to `workspaces`; root scripts.
- `website/tamagui.config.ts` — move to `packages/app`; split animation driver.
- `website/src/services/LocalStorageService.ts` — tag + Schemas move; add AsyncStorage native layer re-implementing the 13 isolated methods (existing `TestLocalStorageServiceLayer` proves the swap).
- `website/src/services/ServiceProvider.ts` — generalize `AppServiceLayer`/`runWithServices` into `makeAppServiceLayer`.
- `website/src/components/Layout.tsx` — canonical `var(--editorial-*)` inline-style coupling to convert.
- `website/next.config.ts` — `transpilePackages += "app"`.
- `packages/questionnaire/package.json` — `@effect/platform-node` + `@effect/cli` Node-only deps driving the Phase 0 Metro spike.

## Risks & Mitigations
- **Metro + Node-only Effect deps (highest):** import only `questionnaire/data` + needed exports; refine `questionnaire` export map if `.` is contaminated; Metro `resolveRequest` shim as last resort. Validate in Phase 0.
- **Two Tamagui instances:** pin exact `1.144.x` everywhere (incl. `@tamagui/metro-plugin`); hoist at root. Monorepo hoisting/dedupe guidance: [Ch 11 § Monorepos](/references/expo/11-common-guides.md#monorepos).
- **Tamagui Metro integration:** native compilation needs `@tamagui/metro-plugin`'s `withTamagui()` wrapping the Metro config, paired with the babel plugin — don't rely on the babel plugin alone. Validate alongside Spike B.
- **Animation driver:** `css` is web-only — never share; resolve via `.web/.native` file extensions. Package is `@tamagui/animations-moti` on v1.144 (`@tamagui/animations-motion` only in v2). Native reanimated/worklets setup: [Ch 15 § Reanimated](/references/expo/15-sdk-ui-components.md#reanimated).
- **CSS-var design system:** mapping not redesign; Playwright visual gate prevents web regressions.
- **Effect/Schema under Hermes:** Effect core is Node-free so risk is low, but RN/Hermes support is *undocumented* in the Effect refs — prove it on-device in Spike A (Schema decode included), not by assumption; keep `@effect/platform-node` off-device.
- **React 19 alignment:** mobile pins SDK's React; `packages/app` treats `react` as peer dep — two separately-bundled copies is fine. New Architecture context: [Ch 11 § New Architecture](/references/expo/11-common-guides.md#new-architecture).

## Verification
- **Three-target dev loop:** web `npm run dev` + Playwright; iOS `npx expo run:ios`; Android `npx expo run:android` (dev-client, not Expo Go — [Ch 09 § Creating a Dev Build](/references/expo/09-development-builds-and-debugging.md#creating-a-dev-build)).
- **Shared contract tests:** one suite (save/read `GameResult`, settings, paired answers) run against both web and native layers; native via `jest-expo` + AsyncStorage mock. Existing `npm run test --workspaces` aggregates.
- **Visual regression:** capture website screenshots of all 5 routes before Phase 4; diff after each component move.
- **CI smoke:** `tsc --build`, workspace Jest, EAS preview build ([Ch 16 § Running a Build](/references/expo/16-eas-build.md#running-a-build) / [Ch 17 § Internal Distribution](/references/expo/17-eas-submit-and-distribution.md#internal-distribution)).

## Fast-follow (out of v1)
MMKV migration; `expo-notifications` push ([Ch 14 § Notifications](/references/expo/14-sdk-data-auth-background.md#notifications), [Ch 11 § Push Notifications](/references/expo/11-common-guides.md#push-notifications)); EAS Update/OTA ([Ch 18](/references/expo/18-eas-update.md#publishing) — see the optional Phase-7 sub-step; could land in v1); App Store/Play submission & signing ([Ch 17](/references/expo/17-eas-submit-and-distribution.md#ios-submission)); full TTS voice-picker parity (`expo-speech` enumeration is weaker than Web — ship default voice + rate first; [Ch 13 § Speech](/references/expo/13-sdk-device-sensors-system.md#speech)); deep linking ([Ch 07 § Deep Linking](/references/expo/07-expo-router-advanced.md#deep-linking), [Ch 11 § Deep Linking](/references/expo/11-common-guides.md#deep-linking) — nearly free once a `scheme` is set, since every expo-router file route already maps to a URL); localization ([Ch 11 § Localization](/references/expo/11-common-guides.md#localization)). (Haptics moved into Phase 6.)
