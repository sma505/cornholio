# Plan: Singles Tournaments & Multi-Court Support

## Context
Add singles tournament support (1v1, no team pairing needed) and multi-court functionality with auto-assignment and court tabs. All existing tournament formats and game modes should work for both singles and teams.

## 1. Singles Tournament Support

### Approach
Treat each player as a 1-person "team". When `tournamentType === 'singles'`, auto-generate team entries from the player list and skip the TeamPairing step. All downstream logic (scheduling, brackets, standings, scoring) works unchanged.

### Settings
```js
settings: {
  ...existing,
  tournamentType: 'teams',  // 'singles' | 'teams'
  numCourts: 1,              // default: 1 for teams, 2 for singles
}
```

### Changes

**`TournamentSetup.svelte`**: Add tournament type toggle (Singles / Teams) above format selection. When switching type, update `numCourts` default (1 for teams, 2 for singles). Add "Number of Courts" input.

**`App.svelte`**: Change step flow — when `tournamentType === 'singles'`, skip `teams` step:
- PlayerEntry "NEXT" goes to `play` instead of `teams`
- Before going to `play`, auto-create teams from players: `[{ id: uuid, name: playerName, players: [playerName] }]`

**`tournament.svelte.js`**: Add `createTeamsFromPlayers()` function that generates 1-player teams. Called when transitioning from players → play in singles mode.

**`PlayerEntry.svelte`**: Adjust min player validation — singles needs min 2 players (not 3).

**`GamePlay.svelte`**: `teamName()` already works since teams will be populated. No change needed.

**No changes**: roundrobin.js, bracket.js, scoring.js, FrameScorer.svelte, Results.svelte

## 2. Multi-Court Support

### Approach
Add `court` field to match objects. Auto-assign unplayed matches to courts round-robin style. Show court tabs in GamePlay to filter visible matches.

### Match structure addition
```js
match: {
  ...existing,
  court: 1,  // 1..numCourts, assigned during initialization
}
```

### Auto-assignment logic
Simple round-robin distribution of matches across courts within each round:
```js
function assignCourts(matches, numCourts) {
  let courtIdx = 0
  for (const match of matches) {
    if (!match.completed) {
      match.court = (courtIdx % numCourts) + 1
      courtIdx++
    }
  }
}
```
Called when matches are generated in GamePlay's `$effect`, and re-called when a match completes (to reassign freed court to next waiting match).

### GamePlay UI changes

**Court tabs** (shown when `numCourts > 1`):
```
[Court 1 (2)]  [Court 2 (1)]  [All]
```
- Placed below the "GAME ON!" header, above match content
- Badge shows count of active (incomplete) matches on that court
- "All" tab shows everything (default for standings/overview)
- Selecting a court tab filters the match list to that court only

**Match display**:
- In round-robin/group view: filter matches by selected court
- In bracket view: show all matches but highlight the selected court's matches
- Standings always show all results regardless of court filter

**Score entry**: Unchanged — works per match as before. When a match on Court 1 is completed, the next unassigned match gets assigned to Court 1.

### Files to modify

| File | Change |
|------|--------|
| `tournament.svelte.js` | Add `tournamentType`, `numCourts` settings; `createTeamsFromPlayers()` |
| `TournamentSetup.svelte` | Tournament type toggle, court count input |
| `App.svelte` | Conditional skip of teams step for singles |
| `PlayerEntry.svelte` | Min 2 players for singles (not 3) |
| `GamePlay.svelte` | Court tabs, match filtering, court assignment on init and match complete |

## Implementation Order
1. Settings: add `tournamentType`, `numCourts` to store
2. TournamentSetup: type toggle + courts input
3. Singles flow: skip teams step, auto-create 1-player teams
4. PlayerEntry: adjust validation for singles
5. GamePlay: court assignment logic + tabs + filtering
6. Test: singles RR, singles SE, teams with 2 courts, singles with 2 courts

## Verification
- Singles RR with 4 players: should generate 6 matches (4C2), no team pairing step
- Singles SE with 5 players: bracket with byes works
- 2 courts: tabs appear, matches distributed, completing one auto-reassigns
- Teams with 1 court: no tabs, unchanged behavior
- Singles with 2 courts: 2 simultaneous matches visible
