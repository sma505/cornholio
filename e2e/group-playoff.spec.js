import { test, expect } from '@playwright/test'
import { freshStart, createTournament, selectFormat, clickNext, addPlayers, shuffleAndStart, submitQuickScore } from './helpers.js'

test.describe('Group + Playoff', () => {
  test('generates groups and matches', async ({ page }) => {
    await freshStart(page)
    await createTournament(page, 'GP-8p')
    await selectFormat(page, 'group-playoff')
    const numGroups = page.locator('#numGroups')
    await numGroups.fill('2')
    await numGroups.dispatchEvent('input')
    const advance = page.locator('#advancePerGroup')
    await advance.fill('1')
    await advance.dispatchEvent('input')
    await clickNext(page)
    await addPlayers(page, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'])
    await clickNext(page)
    await shuffleAndStart(page)
    await expect(page.getByText('GAME ON!')).toBeVisible()
    await expect(page.getByText('Group A')).toBeVisible()
    await expect(page.getByText('Group B')).toBeVisible()
  })

  test('group validation blocks too many groups', async ({ page }) => {
    await freshStart(page)
    await createTournament(page, 'GP-Fail')
    await selectFormat(page, 'group-playoff')
    const numGroups = page.locator('#numGroups')
    await numGroups.fill('4')
    await numGroups.dispatchEvent('input')
    await clickNext(page)
    await addPlayers(page, ['A', 'B', 'C', 'D'])
    await clickNext(page)
    // Shuffle teams
    await page.getByRole('button', { name: 'SHUFFLE TEAMS' }).click()
    await page.waitForTimeout(200)
    // START should be disabled
    const startBtn = page.getByRole('button', { name: 'START TOURNAMENT →' })
    await expect(startBtn).toBeDisabled()
    await expect(page.getByText('needs at least')).toBeVisible()
  })

  test('completes group stage and transitions to bracket', async ({ page }) => {
    await freshStart(page)
    await createTournament(page, 'GP-Full')
    await selectFormat(page, 'group-playoff')
    const numGroups = page.locator('#numGroups')
    await numGroups.fill('2')
    await numGroups.dispatchEvent('input')
    const advance = page.locator('#advancePerGroup')
    await advance.fill('1')
    await advance.dispatchEvent('input')
    await clickNext(page)
    await addPlayers(page, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'])
    await clickNext(page)
    await shuffleAndStart(page)
    // 2 groups of 2 = 2 matches
    await submitQuickScore(page, 21, 15)
    await submitQuickScore(page, 21, 12)
    await page.waitForTimeout(300)
    // Reload and continue to trigger bracket generation
    await page.reload()
    await page.waitForTimeout(500)
    await page.getByRole('button', { name: /CONTINUE|VIEW/ }).click()
    await page.waitForTimeout(500)
    await expect(page.getByRole('heading', { name: 'Playoff Bracket' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Final' })).toBeVisible()
  })
})
