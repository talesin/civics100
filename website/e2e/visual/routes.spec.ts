import { test, expect, Page } from '@playwright/test'
import { seedPage, settle, ThemeName } from './visual.helpers'

/**
 * Phase 4 visual regression suite.
 *
 * Captures all 5 routes x {light, dark} x {desktop, mobile} against seeded,
 * deterministic localStorage state (see visual.helpers.ts). The committed
 * baselines are the guardrail for the CSS-var -> Tamagui token conversion:
 * every conversion batch must reproduce these screenshots within tolerance.
 *
 * Baselines are only valid in the sandbox container they were captured in
 * (font stack differs elsewhere). Never run --update-snapshots on a machine
 * other than the one that produced the committed baselines.
 */

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'mobile', width: 390, height: 844 }
] as const

const THEMES: readonly ThemeName[] = ['light', 'dark'] as const

interface RouteSpec {
  name: string
  path: string
  ready: (page: Page) => Promise<void>
}

const waitForHeading = async (page: Page) => {
  await expect(page.locator('main h1').first()).toBeVisible({ timeout: 15_000 })
}

const ROUTES: readonly RouteSpec[] = [
  { name: 'home', path: '/', ready: waitForHeading },
  {
    name: 'game',
    path: '/game',
    ready: async (page) => {
      await page.waitForSelector('text=Preparing your civics test...', {
        state: 'hidden',
        timeout: 20_000
      })
      await page.waitForSelector('[data-answer-index="0"]', { timeout: 20_000 })
    }
  },
  { name: 'results', path: '/results', ready: waitForHeading },
  { name: 'settings', path: '/settings', ready: waitForHeading },
  { name: 'statistics', path: '/statistics', ready: waitForHeading }
] as const

for (const viewport of VIEWPORTS) {
  for (const theme of THEMES) {
    for (const route of ROUTES) {
      test(`${route.name} ${theme} ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await seedPage(page, theme)
        await page.goto(route.path)
        await route.ready(page)
        await settle(page)
        await expect(page).toHaveScreenshot(`${route.name}-${theme}-${viewport.name}.png`, {
          fullPage: true
        })
      })
    }
  }
}
