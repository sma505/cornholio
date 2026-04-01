import { test, expect } from '@playwright/test'
import { freshStart, createTournament, selectFormat, selectGameMode, clickNext, addPlayers } from './helpers.js'

test.describe('Singles Tournament', () => {
  test('singles skips team pairing step', async ({ page }) => {
    await freshStart(page)
    await createTournament(page, 'Singles RR')
    // Select singles
    await page.getByRole('button', { name: 'Singles' }).click()
    await page.waitForTimeout(100)
    await clickNext(page)
    // Add players
    await addPlayers(page, ['Alice', 'Bob', 'Charlie'])
    await clickNext(page)
    // Should go directly to play (no team pairing)
    await expect(page.getByText('GAME ON!')).toBeVisible()
    // Should see player names directly (not "Alice & Bob" team names)
    await expect(page.getByText('Alice').first()).toBeVisible()
  })

  test('singles with 2 players creates 1 match', async ({ page }) => {
    await freshStart(page)
    await createTournament(page, 'Singles 2p')
    await page.getByRole('button', { name: 'Singles' }).click()
    await page.waitForTimeout(100)
    await clickNext(page)
    await addPlayers(page, ['Alice', 'Bob'])
    await clickNext(page)
    await expect(page.getByText('GAME ON!')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Submit' })).toHaveCount(1)
  })

  test('singles with single elimination works', async ({ page }) => {
    await freshStart(page)
    await createTournament(page, 'Singles SE')
    await page.getByRole('button', { name: 'Singles' }).click()
    await page.waitForTimeout(100)
    await selectFormat(page, 'single-elim')
    await clickNext(page)
    await addPlayers(page, ['Alice', 'Bob', 'Charlie', 'Dave'])
    await clickNext(page)
    await expect(page.getByText('GAME ON!')).toBeVisible()
    await expect(page.getByText('Single Elimination')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Final' }).first()).toBeVisible()
  })

  test('singles defaults to 2 courts', async ({ page }) => {
    await freshStart(page)
    await createTournament(page, 'Singles Courts')
    await page.getByRole('button', { name: 'Singles' }).click()
    await page.waitForTimeout(100)
    // Check courts default
    const courtsInput = page.locator('#numCourts')
    await expect(courtsInput).toHaveValue('2')
  })
})
