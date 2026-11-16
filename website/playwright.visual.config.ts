import { defineConfig, devices } from '@playwright/test'

// Same npm lifecycle env cleanup as playwright.config.ts — see that file.
for (const key of Object.keys(process.env)) {
  if (key.startsWith('npm_config_')) {
    delete process.env[key]
  }
}

/**
 * Visual regression config (Phase 4 design-system port guardrail).
 * Separate from playwright.config.ts so the functional e2e suite is
 * unaffected. Runs against a PRODUCTION next build on its own port so a
 * stray dev server can never be reused, and dev-mode nondeterminism can't
 * leak into baselines. Chromium only — it is the only browser installed.
 */
export default defineConfig({
  testDir: './e2e/visual',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 60_000,

  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
      animations: 'disabled',
      caret: 'hide'
    }
  },

  use: {
    baseURL: 'http://localhost:3101',
    trace: 'on-first-retry',
    deviceScaleFactor: 1
  },

  projects: [{ name: 'visual', use: { ...devices['Desktop Chrome'], deviceScaleFactor: 1 } }],

  webServer: {
    // NODE_ENV forced: the sandbox exports NODE_ENV=development, which breaks
    // `next build` prerendering (React dev/prod mismatch in _global-error).
    command: 'NODE_ENV=production next build && NODE_ENV=production next start --port 3101',
    port: 3101,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000
  }
})
