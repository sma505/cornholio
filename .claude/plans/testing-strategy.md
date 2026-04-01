# Plan: Unit Tests (Vitest) & E2E Tests (Playwright Test)

## Context
The app has grown significantly with multiple game modes, tournament formats, scoring systems, and edge cases. We need automated tests to prevent regressions and stabilize the application. Focus on the testing pyramid: unit tests for business logic, E2E tests for user flows.

## Stack
- **Unit tests**: Vitest (zero-config for Vite projects, tests pure JS utilities)
- **E2E tests**: Playwright Test (`@playwright/test` — proper test runner, not MCP plugin)
- **CI**: GitHub Actions workflow running both

## Phase 1: Unit Tests — Pure JS Utilities

### Setup
```bash
npm install -D vitest
```

`vitest.config.js`:
```js
import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: { globals: true }
})
```

`package.json` scripts:
```json
"test": "vitest",
"test:run": "vitest run"
```

### Test Files

#### `tests/scoring.test.js` (~40 tests)

**`validateScore()`**:
- Standard mode: valid 21-15, valid 21-0, invalid 15-10 (neither reached 21), invalid 25-22 (both >= 21)
- Quick mode: valid 8-3, valid 5-5 draw, invalid draw in bracket (isBracket: true)
- Skunk rule: valid 13-0 with skunk enabled, invalid 12-0 without reaching 21
- Edge: negative numbers, non-integers, NaN

**`getMatchResult()`**:
- Win: score1 > score2 → winnerId = team1Id
- Win: score2 > score1 → winnerId = team2Id
- Draw: score1 === score2 → isDraw: true, winnerId: null

**`calculateFrameResult()`**:
- Net: {team1Pts: 7, team2Pts: 3} → net: 4, scoringTeam: 1
- Wash: {team1Pts: 4, team2Pts: 4} → net: 0, scoringTeam: 0
- Zero: {team1Pts: 0, team2Pts: 0} → net: 0

**`calculateRunningTotal()`**:
- Empty frames → {score1: 0, score2: 0}
- Multiple frames: verify cancellation accumulation
- All washes → {score1: 0, score2: 0}

**`isGameComplete()`**:
- Standard: reaches pointsToWin → true
- Standard: below pointsToWin → false
- Standard: skunk threshold → true (when enabled)
- Quick: frames.length >= numFrames → true
- Quick: frames.length < numFrames → false
- Quick bracket: tied after numFrames → false (sudden death)

**`validateFrame()`**:
- Valid: {team1Pts: 7, team2Pts: 3}
- Invalid: negative, >12, non-integer

**`calculateRawTotal()`**:
- Sum of all team1Pts and team2Pts across frames

#### `tests/roundrobin.test.js` (~25 tests)

**`generateRoundRobinSchedule()`**:
- 2 teams → 1 match
- 3 teams (odd, bye) → 3 matches, no self-matches
- 4 teams → 6 matches across 3 rounds
- 5 teams (odd) → 10 matches, no self-matches, no null teams in output
- Every team plays every other team exactly once
- No duplicate matchups

**`assignGroups()`**:
- 8 teams, 2 groups → snake draft [1,4,5,8] and [2,3,6,7]
- 6 teams, 3 groups → 2 per group
- Uneven: 7 teams, 2 groups → 4 and 3

**`calculateStandings()`**:
- Basic: 2 wins, 1 loss → correct W/L/PF/PA/Diff
- Draws: score1 === score2 → draws incremented, points = 3W + 1D
- Sorting: by points → wins → differential → pointsFor
- Empty matches → all zeros
- Incomplete matches filtered out

#### `tests/bracket.test.js` (~45 tests)

**`generateSingleElimBracket()`**:
- 2 teams → 1 round, 1 match
- 4 teams → 2 rounds, proper seeding (1v4, 2v3)
- 8 teams → 3 rounds, full seeding
- 3 teams → 4-team bracket with 1 bye (top seed gets bye)
- 5 teams → 8-team bracket with 3 byes
- Bye matches auto-completed
- All matches have nextMatchId wired correctly

**`generateDoubleElimBracket()`**:
- Winners bracket matches correct
- Losers bracket rounds created
- Grand finals match exists and is wired

**`advanceBracket()`**:
- Winner placed in next match
- Double elim: loser placed in losers bracket
- Match marked completed
- Score stored correctly

**`getBracketWinner()`**:
- Single elim: last match completed → returns winner
- Double elim: grand finals completed → returns winner
- Incomplete → returns null

### Total: ~110 unit tests

---

## Phase 2: E2E Tests — Playwright Test

### Setup
```bash
npm install -D @playwright/test
npx playwright install chromium
```

`playwright.config.js`:
```js
import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './e2e',
  webServer: {
    command: 'npm run dev -- --port 5174',
    port: 5174,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:5174/cornholio/',
  },
  projects: [
    { name: 'chromium', use: { channel: 'chromium' } },
  ],
})
```

`package.json` scripts:
```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

### Test Files

#### `e2e/home.spec.js` (~5 tests)
- Empty state shows create form
- Create tournament navigates to setup
- Saved tournament appears in list
- Continue resumes at correct step
- Delete removes from list

#### `e2e/setup.spec.js` (~8 tests)
- Format selection updates settings
- Standard mode shows points/skunk, hides frames
- Quick mode shows frames, hides points/skunk
- Best-of visible only in standard mode
- Group settings appear for group-playoff
- Group validation blocks invalid configs

#### `e2e/round-robin-standard.spec.js` (~5 tests)
- 4 players → 2 teams → 1 match RR
- Enter score → standings update
- Crown champion → results screen
- Export JSON works

#### `e2e/round-robin-quick.spec.js` (~5 tests)
- Quick mode with frame-by-frame scoring
- Draw produces correct standings (Pts/D columns)
- Frame counter shows "Frame X of Y"

#### `e2e/group-playoff.spec.js` (~8 tests)
- Groups generated correctly
- Group matches → standings → bracket transition
- Centered bracket layout (left/center/right)
- Play through to champion

#### `e2e/single-elim.spec.js` (~5 tests)
- Bracket with byes for non-power-of-2
- Score entry advances winner
- Champion detected

#### `e2e/best-of-series.spec.js` (~5 tests)
- Bo3: series dots, game history
- Series completion at ceil(bestOf/2) wins
- Finals uses bestOfFinals setting

#### `e2e/cancel-and-resume.spec.js` (~4 tests)
- Cancel returns to teams
- Resume from home continues at correct step
- CORNHOLIO header link goes home

### Total: ~45 E2E tests

---

## Phase 3: CI Integration

`.github/workflows/test.yml`:
```yaml
name: Tests
on: [push, pull_request]
jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run test:run

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Implementation Order
1. Install vitest, create config, write scoring.test.js
2. Write roundrobin.test.js and bracket.test.js
3. Install @playwright/test, create config, write first E2E flow
4. Write remaining E2E specs
5. Add CI workflow
6. Fix any bugs found by tests

## Expected Outcomes
- ~110 unit tests catching logic regressions in scoring, scheduling, brackets
- ~45 E2E tests validating full user flows across all modes
- CI runs on every push, <2 min total
- Playwright report with screenshots on failure
