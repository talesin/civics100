import { test, expect, Page } from '@playwright/test'

/**
 * Extract question info from the header title text.
 * The header link contains "US" (logo) followed by the title,
 * e.g. "USQuestion 1/8 (#3)".
 */
async function getTitleInfo(page: Page) {
  const headerLink = page.locator('header a').first()
  const text = await headerLink.textContent()
  const match = text?.match(/Question (\d+)\/(\d+) \(#(\d+)\)/)
  expect(match, `Expected title to match "Question X/Y (#Z)" but got: "${text}"`).not.toBeNull()
  return {
    currentIndex: parseInt(match![1], 10),
    totalQuestions: parseInt(match![2], 10),
    originalNumber: parseInt(match![3], 10),
  }
}

/**
 * Answer the current question and advance to the next one (or finish).
 * Handles early win prompts by clicking "Continue" to keep playing.
 */
async function answerAndAdvance(page: Page, isLast: boolean) {
  // Wait for answer button and click the first answer
  await page.waitForSelector('[data-answer-index="0"]', { timeout: 10000 })
  await page.click('[data-answer-index="0"]')

  // Wait for the answered state feedback
  await page.waitForSelector('#answer-feedback', { timeout: 5000 })

  if (!isLast) {
    // If an early win prompt appears, click "Continue" to keep playing
    const continueButton = page.locator('button:has-text("Continue")')
    if (await continueButton.isVisible().catch(() => false)) {
      await continueButton.click()
    } else {
      await page.locator('button:has-text("Next Question"), button:has-text("Finish")').click()
    }
    // Wait for next question to load
    await page.waitForSelector('[data-answer-index="0"]', { timeout: 10000 })
  } else {
    // Last question — finish the game
    const earlyFinish = page.locator('button:has-text("Finish Now")')
    if (await earlyFinish.isVisible().catch(() => false)) {
      await earlyFinish.click()
    } else {
      await page.locator('button:has-text("Finish"), button:has-text("Next Question")').click()
    }
  }
}

test.describe('Question number filtering', () => {
  test('specific questions are filtered correctly', async ({ page }) => {
    const selectedNumbers = [1, 2, 3]

    // Navigate to settings and configure practice mode
    await page.goto('/settings')
    await page.waitForSelector('#practice-specific', { timeout: 15000 })

    // Enable practice specific questions
    await page.check('#practice-specific')

    // Enter question numbers
    await page.fill('#question-numbers', '1, 2, 3')

    // Click Start Game
    await page.click('button:has-text("Start Game")')
    await page.waitForURL('/game')

    // Wait for loading to finish
    await page.waitForSelector('text=Preparing your civics test...', {
      state: 'hidden',
      timeout: 15000,
    })

    // Dismiss the keyboard help modal if it appears (shows on first visit)
    const gotItButton = page.locator('button:has-text("Got it!")')
    if (await gotItButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await gotItButton.click()
    }

    // Verify filtered game — should have fewer questions than default 20
    const titleInfo = await getTitleInfo(page)
    expect(titleInfo.totalQuestions).toBeLessThan(20)
    expect(titleInfo.totalQuestions).toBeGreaterThan(0)
    expect(titleInfo.currentIndex).toBe(1)

    // Verify the (#N) corresponds to one of the selected question numbers
    expect(selectedNumbers).toContain(titleInfo.originalNumber)

    const totalQuestions = titleInfo.totalQuestions
    const seenQuestionNumbers: number[] = []

    // Answer all questions, verifying each one's original number
    for (let i = 0; i < totalQuestions; i++) {
      const info = await getTitleInfo(page)
      expect(info.currentIndex).toBe(i + 1)
      expect(info.totalQuestions).toBe(totalQuestions)
      expect(selectedNumbers).toContain(info.originalNumber)

      // Read the question number from the card itself (authoritative check)
      const cardLabel = await page.locator('[data-testid="question-number"]').textContent()
      const cardMatch = cardLabel?.match(/Question #(\d+)/)
      expect(cardMatch, `Expected card label to match "Question #N" but got: "${cardLabel}"`).not.toBeNull()
      const cardNumber = parseInt(cardMatch![1], 10)
      expect(selectedNumbers).toContain(cardNumber)
      seenQuestionNumbers.push(cardNumber)

      await answerAndAdvance(page, i === totalQuestions - 1)
    }

    // Verify all seen question numbers are a subset of selected numbers
    for (const num of seenQuestionNumbers) {
      expect(selectedNumbers).toContain(num)
    }

    // Verify game completed — results screen appears
    await expect(page.locator('text=Game Complete!')).toBeVisible({ timeout: 10000 })
  })

  test('default game shows full question count', async ({ page }) => {
    // Navigate to settings with practice mode disabled
    await page.goto('/settings')
    await page.waitForSelector('#practice-specific', { timeout: 15000 })

    // Make sure practice specific is unchecked
    await page.uncheck('#practice-specific')

    // Click Start Game
    await page.click('button:has-text("Start Game")')
    await page.waitForURL('/game')

    // Wait for loading to finish
    await page.waitForSelector('text=Preparing your civics test...', {
      state: 'hidden',
      timeout: 15000,
    })

    // Verify the title shows /20 (default question count)
    const titleInfo = await getTitleInfo(page)
    expect(titleInfo.totalQuestions).toBe(20)
  })
})
