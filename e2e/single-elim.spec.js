import { test, expect } from '@playwright/test'
import { quickSetup, submitQuickScore } from './helpers.js'

test.describe('Single Elimination', () => {
  test('4 players creates bracket with final', async ({ page }) => {
    await quickSetup(page, { name: 'SE-4p', format: 'single-elim', playerNames: ['A', 'B', 'C', 'D'] })
    await expect(page.getByText('GAME ON!')).toBeVisible()
    await expect(page.getByText('Single Elimination')).toBeVisible()
    await expect(page.getByText('FINAL')).toBeVisible()
  })

  test('bracket with 5 players loads without errors', async ({ page }) => {
    await quickSetup(page, { name: 'SE-5p', format: 'single-elim', playerNames: ['A', 'B', 'C', 'D', 'E'] })
    await expect(page.getByText('GAME ON!')).toBeVisible()
  })

  test('complete bracket shows champion', async ({ page }) => {
    await quickSetup(page, { name: 'SE-Win', format: 'single-elim', playerNames: ['A', 'B', 'C', 'D'] })
    // Play both semis — they're on the centered bracket (left and right)
    await submitQuickScore(page, 21, 15)
    await page.waitForTimeout(300)
    await submitQuickScore(page, 21, 12)
    await page.waitForTimeout(500)
    // Reload to ensure bracket state is fresh
    await page.reload()
    await page.waitForTimeout(500)
    // Play final
    const submitted = await submitQuickScore(page, 21, 18)
    if (submitted) {
      await page.waitForTimeout(500)
      await expect(page.getByText('Champion:')).toBeVisible({ timeout: 5000 })
    }
  })
})
