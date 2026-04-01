/**
 * E2E test helpers for Cornholio tournament flows.
 */

/**
 * Clear localStorage and navigate to home.
 */
export async function freshStart(page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForTimeout(300)
}

/**
 * Create a new tournament and navigate to setup.
 */
export async function createTournament(page, name = 'Test Tournament') {
  await page.getByPlaceholder('Tournament name...').fill(name)
  await page.getByRole('button', { name: 'NEW' }).click()
  await page.waitForTimeout(200)
}

/**
 * Select a tournament format.
 */
export async function selectFormat(page, format) {
  const labels = {
    'round-robin': '🔄 ROUND ROBIN',
    'group-playoff': '🏆 GROUP + PLAYOFF',
    'single-elim': '⚡ SINGLE ELIMINATION',
    'double-elim': '💀 DOUBLE ELIMINATION',
  }
  await page.getByRole('button', { name: labels[format] }).click()
  await page.waitForTimeout(100)
}

/**
 * Select game mode.
 */
export async function selectGameMode(page, mode) {
  if (mode === 'quick') {
    await page.getByRole('button', { name: 'Quick' }).click()
  } else {
    await page.getByRole('button', { name: 'Standard' }).click()
  }
  await page.waitForTimeout(100)
}

/**
 * Go to next step.
 */
export async function clickNext(page) {
  await page.getByRole('button', { name: 'NEXT →' }).click()
  await page.waitForTimeout(200)
}

/**
 * Add players by name.
 */
export async function addPlayers(page, names) {
  for (const name of names) {
    const input = page.getByPlaceholder('Enter player name...')
    await input.click()
    await input.pressSequentially(name, { delay: 5 })
    await input.press('Enter')
    await page.waitForTimeout(50)
  }
}

/**
 * Shuffle teams and start tournament.
 */
export async function shuffleAndStart(page) {
  await page.getByRole('button', { name: 'SHUFFLE TEAMS' }).click()
  await page.waitForTimeout(200)
  await page.getByRole('button', { name: 'START TOURNAMENT →' }).click()
  await page.waitForTimeout(400)
}

/**
 * Submit a quick score for the first available match.
 * Returns true if a score was submitted, false if no Submit button found.
 */
export async function submitQuickScore(page, score1, score2) {
  const submitBtns = page.getByRole('button', { name: 'Submit' })
  if (await submitBtns.count() === 0) return false
  const btn = submitBtns.first()
  const container = btn.locator('..')
  const inputs = container.locator('input[type="number"]')
  if (await inputs.count() < 2) return false
  await inputs.nth(0).click()
  await inputs.nth(0).pressSequentially(String(score1), { delay: 5 })
  await inputs.nth(1).click()
  await inputs.nth(1).pressSequentially(String(score2), { delay: 5 })
  await btn.click()
  await page.waitForTimeout(200)
  return true
}

/**
 * Quick setup: create tournament, select format/mode, add players, shuffle, start.
 */
export async function quickSetup(page, opts = {}) {
  const {
    name = 'Test',
    format = 'round-robin',
    gameMode = 'standard',
    playerNames = ['P1', 'P2', 'P3', 'P4'],
    numGroups,
    advancePerGroup,
  } = opts

  await freshStart(page)
  await createTournament(page, name)

  if (format !== 'round-robin') await selectFormat(page, format)
  if (gameMode === 'quick') await selectGameMode(page, 'quick')

  if (numGroups) {
    const g = page.locator('#numGroups')
    if (await g.isVisible().catch(() => false)) {
      await g.fill(String(numGroups))
      await g.dispatchEvent('input')
    }
  }
  if (advancePerGroup) {
    const a = page.locator('#advancePerGroup')
    if (await a.isVisible().catch(() => false)) {
      await a.fill(String(advancePerGroup))
      await a.dispatchEvent('input')
    }
  }

  await clickNext(page)
  await addPlayers(page, playerNames)
  await clickNext(page)
  await shuffleAndStart(page)
}
