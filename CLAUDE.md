# Cornholio - Cornhole Tournament Manager

## Project Overview
A single-page webapp for creating and running cornhole tournaments with Beavis & Butthead "Cornholio" theming. Supports singles and teams, multiple tournament formats, two game modes, best-of series, frame-by-frame scoring, draw support, multi-court play, and multi-tournament management.

## Tech Stack
- **Framework**: Svelte 5 (runes: `$state`, `$derived`, `$effect`) + Vite
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/vite` plugin)
- **Drag & Drop**: SortableJS
- **Testing**: Vitest (unit) + Playwright Test (E2E)
- **Environment**: NixOS with direnv (`flake.nix` provides Node 22 + Playwright browsers)
- **Repo**: Public at `github.com/sma505/cornholio`
- **Deployed**: GitHub Pages at `sma505.github.io/cornholio/`

## Commands
- `npm run dev` — dev server (base path `/cornholio/`)
- `npm run build` — production build to `dist/`
- `npm run test:run` — run unit tests (89 tests, <1s)
- `npm run test:e2e` — run E2E tests (28 tests, ~30s)
- `npm run test` — vitest in watch mode

## Architecture

### State Management
Single reactive state object in `src/lib/stores/tournament.svelte.js` using Svelte 5 runes. Auto-saves to localStorage (debounced 300ms). Export/import as JSON files.

**Multi-tournament storage**: Each tournament stored as `cornholio-t-{uuid}` in localStorage with a `cornholio-index` key tracking the list. Old single-tournament format auto-migrated on first load.

**Important**: Never name a local variable `state` in Svelte components that also use `$state()` rune — it causes a store_rune_conflict. Use `tournament` instead (via `const tournament = getState()`).

### App Flow (step-based navigation)
- **Teams**: `home` → `setup` → `players` → `teams` → `play` → `results`
- **Singles**: `home` → `setup` → `players` → `play` → `results` (skips team pairing)

Navigation:
- Home screen lists saved tournaments (create, continue, export, delete)
- Cancel tournament returns to `teams` (teams) or `players` (singles)
- CORNHOLIO header is clickable to return to Home (force-saves before navigating)
- Results "New Tournament" returns to Home

### Tournament Types
- **Teams**: Players paired into teams of 2 (manual drag-drop or random shuffle)
- **Singles**: 1v1 matchups, auto-creates 1-player "teams" from player list (reuses all downstream logic)

### Tournament Formats
1. **Round Robin** — all teams/players play each other
2. **Group + Playoff** — group stage round-robin, top advance to single-elimination bracket
3. **Single Elimination** — standard bracket with byes (left-to-right layout, mobile stacks vertically)
4. **Double Elimination** — winners/losers brackets + grand finals (left-to-right layout)

Bracket layout: all bracket formats use left-to-right flow on desktop (Round 1 → ... → Final), vertical stack on mobile (<768px). Bye matches show as "Player — bye".

### Game Modes
- **Standard**: Play until one team reaches `pointsToWin` (default 21). Optional skunk rule. Best-of series configurable per stage (Bo1/3/5).
- **Quick**: Fixed number of frames per stage (configurable, default 3). Highest cancellation-scored total wins. Draws allowed in group/round-robin. Sudden-death extra frames for tied bracket matches. Always Bo1 (no series).

### Multi-Court Support
- Configurable court count (1-8, default 1 for teams, 2 for singles)
- Court tabs in GamePlay when `numCourts > 1` (All / Court 1 / Court 2 / ...)
- Auto-assignment of matches to courts (round-robin distribution for RR/group matches, playability-based for brackets)
- Court badge shown on all match cards (bracket and RR/group) when multi-court enabled, including completed matches
- Non-selected court matches dimmed in bracket view, filtered in RR/group view
- Courts reassigned when matches complete

### Scoring
- **Cancellation scoring**: 3pts for hole, 1pt for board, only net differential counts per frame
- **Two entry modes** (set at tournament creation, not changeable during play):
  - **Total**: Enter final cancelled scores directly
  - **Frame-by-frame**: Enter raw points per team per frame with live cancellation preview
- **Scoring mode**: Configured in TournamentSetup via `defaultScoringMode` setting ('quick' = Total, 'frames' = Frame-by-frame). Explanation hint shown inline on setup page.
- **Draw support** (quick mode): Standings use football-style points (3W/1D/0L), sorted by points → wins → differential

### Settings Shape
```js
settings: {
  tournamentType: 'teams',       // 'singles' | 'teams'
  numCourts: 1,                   // 1-8, default 1 (teams) or 2 (singles)
  format: 'round-robin' | 'group-playoff' | 'single-elim' | 'double-elim',
  gameMode: 'standard' | 'quick',
  pointsToWin: 21,               // standard mode
  skunkRule: false,               // standard mode
  skunkDiff: 13,                  // standard mode
  numFramesGroup: 3,              // quick mode: frames per stage
  numFramesPlayoff: 3,
  numFramesFinals: 3,
  numGroups: 2,                   // group-playoff
  advancePerGroup: 2,
  bestOfGroup: 1,                 // standard mode: series per stage
  bestOfPlayoff: 3,
  bestOfFinals: 5,
  defaultScoringMode: 'quick',   // 'quick' (Total) or 'frames' (Frame-by-frame)
}
```

### Key Files
```
src/
  App.svelte                          # Step-based router, conditional flow for singles/teams
  lib/
    stores/tournament.svelte.js       # Central state store, multi-tournament, createTeamsFromPlayers
    utils/
      scoring.js                      # Score validation, frame calculations, draw detection
      roundrobin.js                   # Round-robin scheduling, groups, standings (with draws)
      bracket.js                      # Single/double elimination brackets
      persistence.js                  # Multi-tournament localStorage, JSON export/import
    components/
      Home.svelte                     # Tournament list: create, continue, export, delete
      TournamentSetup.svelte          # Type, format, game mode, courts, rules, tournament name
      PlayerEntry.svelte              # Add/remove players (min 2 singles, 3 teams)
      TeamPairing.svelte              # Drag-drop or shuffle into teams of 2 (teams only)
      GamePlay.svelte                 # Score entry, standings, centered bracket, court tabs
      FrameScorer.svelte              # Frame-by-frame raw points entry with running totals
      Results.svelte                  # Champion display, export, celebration
      ui/CornholioHeader.svelte       # Fixed-height header with step nav and rotating quotes
tests/
  scoring.test.js                     # 38 unit tests
  roundrobin.test.js                  # 23 unit tests
  bracket.test.js                     # 28 unit tests
e2e/
  helpers.js                          # Shared E2E test utilities
  home.spec.js                        # Home screen tests (5)
  round-robin.spec.js                 # RR standard + quick mode tests (7)
  single-elim.spec.js                 # Single elimination tests (3)
  group-playoff.spec.js               # Group + playoff tests (3)
  cancel-resume.spec.js               # Cancel and resume tests (3)
  singles.spec.js                     # Singles tournament tests (4)
  courts.spec.js                      # Multi-court tests (3)
```

### Theming
- **Colors**: Dark blue (#1a1a4e) bg, gold (#f5c542) accents, off-white (#f0e6d3) text
- **Font**: Bangers (Google Fonts) for headings
- **Quotes**: Rotating Cornholio quotes in header every 5 seconds (fixed height, no layout shift)

## Conventions
- All components use Svelte 5 runes, not legacy stores
- Tailwind classes use custom theme colors: `cornholio-dark`, `cornholio-blue`, `cornholio-navy`, `cornholio-gold`, `cornholio-gold-light`, `cornholio-red`, `cornholio-gray`, `cornholio-gray-light`, `tp-white`, `tp-cream`
- Tournament logic (scheduling, scoring, brackets) lives in pure JS utility files with no framework dependencies
- `font-heading` class for Bangers font headings
- `getMatchResult()` returns `{ isDraw: true }` when scores are equal — always check before accessing `winnerId`
- `advanceBracket()` takes `(bracket, matchId, winnerId, loserId)` — NOT scores
- Group validation: numGroups * 2 minimum teams required
- Quick mode forces Bo1 — `getBestOf()` returns 1 when `gameMode === 'quick'`
- `getNumFrames(match)` resolves per-stage frame count based on match context
- Don't mutate `$state` inside template expressions or `$derived` — use read-only functions for templates, mutating functions only in event handlers
- `goHome()` force-saves before navigating to prevent data loss from debounced saves
- Court assignment: call `assignCourts()` before `setMatches()`, call `assignBracketCourts()` after bracket generation and after each bracket match completion

## Testing
- **Unit tests** (Vitest): `npm run test:run` — 178 tests covering scoring, round-robin, bracket logic
- **E2E tests** (Playwright Test): `npm run test:e2e` — 28 tests covering all tournament flows
- **CI**: GitHub Actions deploys on push to main (tests not yet in CI — add `.github/workflows/test.yml`)

### NixOS + Playwright Setup
- Playwright browsers are provided by the Nix flake via `playwright-driver.browsers`
- **Important**: `PLAYWRIGHT_BROWSERS_PATH` must NOT be exported globally in the devShell — it gets inherited by the MCP Playwright plugin process, which then tries to `mkdir` inside the read-only Nix store and crashes
- Instead, `flake.nix` exports `NIX_PLAYWRIGHT_BROWSERS_PATH` and the npm scripts in `package.json` set `PLAYWRIGHT_BROWSERS_PATH=$NIX_PLAYWRIGHT_BROWSERS_PATH` inline when invoking `playwright test`
- The MCP Playwright plugin (for Claude Code visual verification) uses `google-chrome-stable` from the system PATH via `--executable-path` in its `.mcp.json` config — it does NOT use the Nix-provided browsers
- Vite's file watcher excludes `.direnv/` (configured in `vite.config.js`) to avoid hitting inotify limits from Nix store symlinks

## Deployment
- **GitHub Pages**: Auto-deploys via `.github/workflows/deploy.yml` on push to main
- **Base path**: `/cornholio/` (configured in `vite.config.js`)
- **Live at**: https://sma505.github.io/cornholio/
