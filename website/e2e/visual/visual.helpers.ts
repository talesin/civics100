import { Page } from '@playwright/test'

/**
 * Deterministic state seeding for visual regression shots.
 *
 * Everything the five routes read from localStorage is written up front, and
 * the two runtime randomness sources are pinned:
 *  - Math.random is replaced with a seeded mulberry32 PRNG *before any page
 *    script runs*. Effect's default Random service is seeded from
 *    Math.random() at module load (effect/internal/defaultServices.js), so
 *    this makes every questionnaire shuffle (question order, distractors,
 *    answer order) reproducible.
 *  - Date is fixed via page.clock so session timestamps and any relative
 *    date rendering can never drift.
 */

export const FIXED_TIME = new Date('2026-07-01T12:00:00.000Z')

export type ThemeName = 'light' | 'dark'

const GAME_SETTINGS = {
  maxQuestions: 20,
  winThreshold: 12,
  userState: 'CA'
}

const GAME_RESULTS = [
  {
    sessionId: 'visual-seed-1',
    totalQuestions: 20,
    correctAnswers: 18,
    incorrectAnswers: 2,
    percentage: 90,
    isEarlyWin: false,
    isEarlyFail: false,
    completedAt: '2026-06-28T15:30:00.000Z'
  },
  {
    sessionId: 'visual-seed-2',
    totalQuestions: 20,
    correctAnswers: 12,
    incorrectAnswers: 3,
    percentage: 80,
    isEarlyWin: true,
    isEarlyFail: false,
    completedAt: '2026-06-24T09:10:00.000Z'
  },
  {
    sessionId: 'visual-seed-3',
    totalQuestions: 20,
    correctAnswers: 5,
    incorrectAnswers: 15,
    percentage: 25,
    isEarlyWin: false,
    isEarlyFail: false,
    completedAt: '2026-06-20T19:45:00.000Z'
  }
]

const PAIRED_ANSWERS = {
  '1-0': [
    { ts: '2026-06-20T19:40:00.000Z', correct: true },
    { ts: '2026-06-24T09:00:00.000Z', correct: true }
  ],
  '2-0': [
    { ts: '2026-06-20T19:41:00.000Z', correct: false },
    { ts: '2026-06-24T09:01:00.000Z', correct: true }
  ],
  '3-0': [{ ts: '2026-06-20T19:42:00.000Z', correct: false }],
  '48-0': [
    { ts: '2026-06-24T09:03:00.000Z', correct: true },
    { ts: '2026-06-28T15:20:00.000Z', correct: false }
  ]
}

export async function seedPage(page: Page, theme: ThemeName): Promise<void> {
  await page.clock.setFixedTime(FIXED_TIME)

  await page.addInitScript(
    ([themeName, settings, results, paired]) => {
      // Constant Math.random — must be installed before any app module loads.
      // Effect's default Random service is seeded from a SINGLE Math.random()
      // call at module load (effect/internal/defaultServices.js). A sequential
      // PRNG stub proved flaky here: the seed became sensitive to how many
      // other callers consumed the sequence first, which varies slightly
      // between page loads. A constant makes the seed — and therefore every
      // questionnaire shuffle — identical regardless of call order. No app
      // code relies on Math.random distinctness (verified: zero call sites).
      Math.random = () => 0.42

      // Never let the service worker install: its controllerchange handler
      // (ServiceWorkerRegistration.tsx) reloads the page, destroying the
      // execution context mid-shot on whichever routes lose the race.
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register = () => new Promise<never>(() => {})
      }

      window.localStorage.setItem('theme', themeName as string)
      window.localStorage.setItem('civics100_storage_version', '1.0.0')
      window.localStorage.setItem('civics100_game_settings', JSON.stringify(settings))
      window.localStorage.setItem('civics100_game_results', JSON.stringify(results))
      window.localStorage.setItem('civics100_paired_answers', JSON.stringify(paired))
      window.localStorage.setItem('civics-keyboard-help-seen', 'true')
      window.localStorage.setItem('pwa-install-dismissed', 'true')
    },
    [theme, GAME_SETTINGS, GAME_RESULTS, PAIRED_ANSWERS] as const
  )
}

/**
 * Wait until the page is visually at rest: fonts loaded and the JS-driven
 * entrance animations (framer-motion on the home page) finished. CSS
 * animations are handled by toHaveScreenshot({ animations: 'disabled' });
 * the fixed wait covers framer-motion's ~0.9s staggered fade which Playwright
 * cannot always fast-forward.
 */
export async function settle(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(1200)
}
