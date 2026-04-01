import { test, expect } from '@playwright/test'
import { freshStart, createTournament, quickSetup, clickNext, addPlayers } from './helpers.js'

test.describe('Home Screen', () => {
  test('shows create form on empty state', async ({ page }) => {
    await freshStart(page)
    await expect(page.getByPlaceholder('Tournament name...')).toBeVisible()
    await expect(page.getByRole('button', { name: 'NEW' })).toBeVisible()
  })

  test('creates tournament and navigates to setup', async ({ page }) => {
    await freshStart(page)
    await createTournament(page, 'BBQ Showdown')
    await expect(page.getByText('TOURNAMENT SETUP')).toBeVisible()
  })

  test('saved tournament appears in list after navigating away', async ({ page }) => {
    await freshStart(page)
    await createTournament(page, 'My Tournament')
    // Progress to players so it saves
    await clickNext(page)
    await addPlayers(page, ['A', 'B', 'C'])
    // Go home
    await page.getByRole('button', { name: 'CORNHOLIO' }).click()
    await page.waitForTimeout(300)
    await expect(page.getByText('My Tournament')).toBeVisible()
  })

  test('continue resumes tournament at correct step', async ({ page }) => {
    await freshStart(page)
    await createTournament(page, 'Resume Test')
    await clickNext(page) // to players
    await addPlayers(page, ['A', 'B', 'C'])
    // Go home
    await page.getByRole('button', { name: 'CORNHOLIO' }).click()
    await page.waitForTimeout(300)
    // Continue
    await page.getByRole('button', { name: 'CONTINUE' }).click()
    await page.waitForTimeout(300)
    await expect(page.getByText('ADD PLAYERS')).toBeVisible()
  })

  test('delete removes tournament from list', async ({ page }) => {
    await freshStart(page)
    await createTournament(page, 'Delete Me')
    await clickNext(page) // progress so it saves
    await addPlayers(page, ['A', 'B', 'C'])
    // Go home
    await page.getByRole('button', { name: 'CORNHOLIO' }).click()
    await page.waitForTimeout(300)
    await expect(page.getByText('Delete Me')).toBeVisible()
    // Click delete
    await page.getByTitle('Delete').click()
    await page.waitForTimeout(100)
    // Confirm delete
    await page.getByText('Delete', { exact: true }).last().click()
    await page.waitForTimeout(200)
    await expect(page.getByText('Delete Me')).not.toBeVisible()
  })
})
