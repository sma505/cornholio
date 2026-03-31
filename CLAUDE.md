# Cornholio - Cornhole Tournament Manager

## Project Overview
A single-page webapp for creating and running cornhole tournaments with Beavis & Butthead "Cornholio" theming. Supports multiple tournament formats, two game modes (standard play-to-21 and quick fixed-frames), best-of series, frame-by-frame scoring, draw support, and multi-tournament management.

## Tech Stack
- **Framework**: Svelte 5 (runes: `$state`, `$derived`, `$effect`) + Vite
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/vite` plugin)
- **Drag & Drop**: SortableJS
- **Environment**: NixOS with direnv (`flake.nix` provides Node 22)
- **Repo**: Public at `github.com/sma505/cornholio`
- **Deployed**: GitHub Pages at `sma505.github.io/cornholio/`

## Commands
- `npm run dev` — dev server (port 5173, base path `/cornholio/`)
- `npm run build` — production build to `dist/`
- `npm run preview` — preview production build

## Architecture

### State Management
Single reactive state object in `src/lib/stores/tournament.svelte.js` using Svelte 5 runes. Auto-saves to localStorage (debounced 300ms). Export/import as JSON files.

**Multi-tournament storage**: Each tournament stored as `cornholio-t-{uuid}` in localStorage with a `cornholio-index` key tracking the list. Old single-tournament format auto-migrated on first load.

**Important**: Never name a local variable `state` in Svelte components that also use `$state()` rune — it causes a store_rune_conflict. Use `tournament` instead (via `const tournament = getState()`).

### App Flow (step-based navigation)
`home` → `setup` → `players` → `teams` → `play` → `results`

- Home screen lists saved tournaments (create, continue, export, delete)
- Cancel tournament from play screen returns to `teams` (preserves players/settings)
- CORNHOLIO header is clickable to return to Home from any step
- Results "New Tournament" returns to Home

### Tournament Formats
1. **Round Robin** — all teams play each other
2. **Group + Playoff** — group stage round-robin, top teams advance to single-elimination bracket (centered bracket layout: finals in center, semis on left/right)
3. **Single Elimination** — standard bracket with byes (centered layout)
4. **Double Elimination** — winners/losers brackets + grand finals (left-to-right layout)

### Game Modes
- **Standard**: Play until one team reaches `pointsToWin` (default 21). Optional skunk rule. Best-of series configurable per stage (Bo1/3/5).
- **Quick**: Fixed number of frames per stage (configurable, default 3). Highest cancellation-scored total wins. Draws allowed in group/round-robin. Sudden-death extra frames for tied bracket matches. Always Bo1 (no series).

### Scoring
- **Cancellation scoring**: 3pts for hole, 1pt for board, only net differential counts per frame
- **Two entry modes per match** (toggle: "Total" / "Frame-by-frame"): Total enters final scores directly; Frame-by-frame enters raw points per team per frame with live cancellation preview
- **Default scoring mode**: Configurable in setup (applies to all matches, overridable per match)
- **Draw support** (quick mode): Standings use football-style points (3W/1D/0L), sorted by points → wins → differential

### Settings Shape
```js
settings: {
  format: 'round-robin' | 'group-playoff' | 'single-elim' | 'double-elim',
  gameMode: 'standard' | 'quick',
  pointsToWin: 21,           // standard mode
  skunkRule: false,           // standard mode
  skunkDiff: 13,              // standard mode
  numFramesGroup: 3,          // quick mode: frames per game in groups/RR
  numFramesPlayoff: 3,        // quick mode: frames per game in playoffs
  numFramesFinals: 3,         // quick mode: frames per game in finals
  numGroups: 2,               // group-playoff
  advancePerGroup: 2,         // group-playoff
  bestOfGroup: 1,             // standard mode: series per stage
  bestOfPlayoff: 3,           // standard mode: series per stage
  bestOfFinals: 5,            // standard mode: series per stage
  defaultScoringMode: 'quick', // 'quick' (Total) or 'frames' (Frame-by-frame)
}
```

### Key Files
```
src/
  App.svelte                          # Step-based router (home/setup/players/teams/play/results)
  lib/
    stores/tournament.svelte.js       # Central state store, multi-tournament management
    utils/
      scoring.js                      # Score validation, frame calculations, draw detection
      roundrobin.js                   # Round-robin scheduling, groups, standings (with draws)
      bracket.js                      # Single/double elimination brackets
      persistence.js                  # Multi-tournament localStorage, JSON export/import
    components/
      Home.svelte                     # Tournament list: create, continue, export, delete
      TournamentSetup.svelte          # Format, game mode, rules config, tournament name
      PlayerEntry.svelte              # Add/remove players
      TeamPairing.svelte              # Drag-drop or shuffle into teams of 2
      GamePlay.svelte                 # Main game screen: score entry, standings, centered bracket
      FrameScorer.svelte              # Frame-by-frame raw points entry with running totals
      Results.svelte                  # Champion display, export, celebration
      ui/CornholioHeader.svelte       # Fixed-height header with step nav and rotating quotes
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

## Deployment
- **GitHub Pages**: Auto-deploys via `.github/workflows/deploy.yml` on push to main
- **Base path**: `/cornholio/` (configured in `vite.config.js`)
- **Live at**: https://sma505.github.io/cornholio/
