import { test, expect } from '@playwright/test'
import { quickSetup, freshStart } from './helpers.js'

test.describe('Cancel and Resume', () => {
  test('cancel tournament returns to teams', async ({ page }) => {
    await quickSetup(page, { name: 'Cancel-Test', playerNames: ['A', 'B', 'C', 'D'] })
    await expect(page.getByText('GAME ON!')).toBeVisible()
    await page.getByText('Cancel Tournament').click()
    await page.waitForTimeout(200)
    await page.getByRole('button', { name: 'CANCEL', exact: true }).click()
    await page.waitForTimeout(300)
    await expect(page.getByText('TEAM PAIRING')).toBeVisible()
  })

  test('CORNHOLIO header link goes home', async ({ page }) => {
    await quickSetup(page, { name: 'Home-Link', playerNames: ['A', 'B', 'C', 'D'] })
    await page.getByRole('button', { name: 'CORNHOLIO' }).click()
    await page.waitForTimeout(300)
    await expect(page.getByPlaceholder('Tournament name...')).toBeVisible()
    await expect(page.getByText('Home-Link')).toBeVisible()
  })

  test('resume from home continues at play step', async ({ page }) => {
    await quickSetup(page, { name: 'Resume-Play', playerNames: ['A', 'B', 'C', 'D'] })
    await expect(page.getByText('GAME ON!')).toBeVisible()
    // Go home
    await page.getByRole('button', { name: 'CORNHOLIO' }).click()
    await page.waitForTimeout(300)
    // Continue
    await page.getByRole('button', { name: 'CONTINUE' }).click()
    await page.waitForTimeout(500)
    await expect(page.getByText('GAME ON!')).toBeVisible()
  })
})
