import { test, expect } from '@playwright/test'
import { quickSetup, submitQuickScore } from './helpers.js'

test.describe('Round Robin - Standard', () => {
  test('4 players creates 2 teams with 1 match', async ({ page }) => {
    await quickSetup(page, { name: 'RR-4p', playerNames: ['A', 'B', 'C', 'D'] })
    await expect(page.getByText('GAME ON!')).toBeVisible()
    await expect(page.locator('main').getByText('Round Robin')).toBeVisible()
    // Should have 1 match (2 teams)
    await expect(page.getByRole('button', { name: 'Submit' })).toHaveCount(1)
  })

  test('6 players creates 3 teams with 3 matches', async ({ page }) => {
    await quickSetup(page, { name: 'RR-6p', playerNames: ['A', 'B', 'C', 'D', 'E', 'F'] })
    await expect(page.getByRole('button', { name: 'Submit' })).toHaveCount(3)
  })

  test('complete tournament shows champion', async ({ page }) => {
    await quickSetup(page, { name: 'RR-Complete', playerNames: ['A', 'B', 'C', 'D'] })
    await submitQuickScore(page, 21, 15)
    await expect(page.getByText('CROWN THE CHAMPION')).toBeVisible()
    await page.getByRole('button', { name: 'CROWN THE CHAMPION' }).click()
    await expect(page.getByText('Champion:')).toBeVisible()
  })

  test('standings update after score entry', async ({ page }) => {
    await quickSetup(page, { name: 'RR-Standings', playerNames: ['A', 'B', 'C', 'D', 'E', 'F'] })
    await submitQuickScore(page, 21, 10)
    // Check standings shows 1 win
    const table = page.locator('table')
    await expect(table.getByText('1').first()).toBeVisible()
  })
})

test.describe('Round Robin - Quick Mode', () => {
  test('quick mode shows correct header', async ({ page }) => {
    await quickSetup(page, { name: 'RR-Quick', gameMode: 'quick', playerNames: ['A', 'B', 'C', 'D'] })
    await expect(page.getByText('Quick Mode')).toBeVisible()
  })

  test('draw allowed in quick mode', async ({ page }) => {
    await quickSetup(page, { name: 'RR-Draw', gameMode: 'quick', playerNames: ['A', 'B', 'C', 'D'] })
    await submitQuickScore(page, 5, 5)
    await expect(page.getByText('DRAW')).toBeVisible()
  })

  test('standings show Pts and D columns in quick mode', async ({ page }) => {
    await quickSetup(page, { name: 'RR-Cols', gameMode: 'quick', playerNames: ['A', 'B', 'C', 'D'] })
    const table = page.locator('table')
    await expect(table.getByText('Pts')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'D', exact: true })).toBeVisible()
  })
})
