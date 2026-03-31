# Cornholio - Cornhole Tournament Manager

## Project Overview
A single-page webapp for creating and running cornhole tournaments with Beavis & Butthead "Cornholio" theming.

## Tech Stack
- **Framework**: Svelte 5 (runes: `$state`, `$derived`, `$effect`) + Vite
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/vite` plugin)
- **Drag & Drop**: SortableJS
- **Environment**: NixOS with direnv (`flake.nix` provides Node 22)
- **Repo**: Private at `github.com/sma505/cornholio`

## Commands
- `npm run dev` — dev server (port 5173)
- `npm run build` — production build to `dist/`
- `npm run preview` — preview production build

## Architecture

### State Management
Single reactive state object in `src/lib/stores/tournament.svelte.js` using Svelte 5 runes. Auto-saves to localStorage (debounced 300ms). Export/import as JSON files.

**Important**: Never name a local variable `state` in Svelte components that also use `$state()` rune — it causes a store_rune_conflict. Use `tournament` instead (via `const tournament = getState()`).

### App Flow (step-based navigation)
`welcome` → `setup` → `players` → `teams` → `play` → `results`

### Tournament Formats
1. **Round Robin** — all teams play each other
2. **Group + Playoff** — group stage round-robin, top teams advance to single-elimination bracket
3. **Single Elimination** — standard bracket with byes
4. **Double Elimination** — winners/losers brackets + grand finals

### Scoring
- **Cancellation scoring**: 3pts for hole, 1pt for board, only differential counts per frame
- **Game to 21** (configurable), optional skunk rule (13+ differential)
- **Two entry modes**: Quick Score (final totals) or Frame-by-Frame (bag counts per frame)
- **Best-of series**: Configurable per stage (group: Bo1/3/5, playoff: Bo1/3/5, finals: Bo1/3/5)

### Key Files
```
src/
  App.svelte                          # Step-based router
  lib/
    stores/tournament.svelte.js       # Central state store + all mutations
    utils/
      scoring.js                      # Score validation, frame calculations
      roundrobin.js                   # Round-robin scheduling, groups, standings
      bracket.js                      # Single/double elimination brackets
      persistence.js                  # localStorage, JSON export/import
    components/
      Welcome.svelte                  # Splash screen
      TournamentSetup.svelte          # Format selection, rules config
      PlayerEntry.svelte              # Add/remove players
      TeamPairing.svelte              # Drag-drop or shuffle into teams of 2
      GamePlay.svelte                 # Main game screen (score entry, standings, brackets)
      FrameScorer.svelte              # Frame-by-frame bag count entry
      Results.svelte                  # Champion display, export, celebration
      ui/CornholioHeader.svelte       # Header with step nav and rotating quotes
```

### Theming
- **Colors**: Dark blue (#1a1a4e) bg, gold (#f5c542) accents, off-white (#f0e6d3) text
- **Font**: Bangers (Google Fonts) for headings
- **Quotes**: Rotating Cornholio quotes in header every 5 seconds

## Conventions
- All components use Svelte 5 runes, not legacy stores
- Tailwind classes use custom theme colors: `cornholio-dark`, `cornholio-blue`, `cornholio-navy`, `cornholio-gold`, `cornholio-gold-light`, `cornholio-red`, `cornholio-gray`, `cornholio-gray-light`, `tp-white`, `tp-cream`
- Tournament logic (scheduling, scoring, brackets) lives in pure JS utility files with no framework dependencies
- `font-heading` class for Bangers font headings
