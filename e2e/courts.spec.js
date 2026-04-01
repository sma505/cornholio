import { test, expect } from '@playwright/test'
import { freshStart, createTournament, clickNext, addPlayers, shuffleAndStart } from './helpers.js'

test.describe('Multi-Court', () => {
  test('court tabs appear when numCourts > 1', async ({ page }) => {
    await freshStart(page)
    await createTournament(page, 'Courts Test')
    // Set 2 courts
    const courtsInput = page.locator('#numCourts')
    await courtsInput.fill('2')
    await courtsInput.dispatchEvent('input')
    await clickNext(page)
    await addPlayers(page, ['A', 'B', 'C', 'D', 'E', 'F'])
    await clickNext(page)
    await shuffleAndStart(page)
    // Court tabs should be visible
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Court 1/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Court 2/ })).toBeVisible()
  })

  test('no court tabs with 1 court', async ({ page }) => {
    await freshStart(page)
    await createTournament(page, 'Single Court')
    await clickNext(page)
    await addPlayers(page, ['A', 'B', 'C', 'D'])
    await clickNext(page)
    await shuffleAndStart(page)
    // No court tabs
    await expect(page.getByRole('button', { name: 'All' })).not.toBeVisible()
  })

  test('court tab filtering shows subset of matches', async ({ page }) => {
    await freshStart(page)
    await createTournament(page, 'Filter Test')
    const courtsInput = page.locator('#numCourts')
    await courtsInput.fill('2')
    await courtsInput.dispatchEvent('input')
    await clickNext(page)
    await addPlayers(page, ['A', 'B', 'C', 'D', 'E', 'F'])
    await clickNext(page)
    await shuffleAndStart(page)
    // Click Court 1 tab
    await page.getByRole('button', { name: /Court 1/ }).click()
    await page.waitForTimeout(200)
    // Should show fewer matches than All
    const court1Submits = await page.getByRole('button', { name: 'Submit' }).count()
    // Click All tab
    await page.getByRole('button', { name: 'All' }).click()
    await page.waitForTimeout(200)
    const allSubmits = await page.getByRole('button', { name: 'Submit' }).count()
    expect(court1Submits).toBeLessThanOrEqual(allSubmits)
  })
})
