<script>
  import { getState, setMatches, setGroups, setBracket, updateMatch, setStep, setChampion, cancelTournament } from '../stores/tournament.svelte.js'
  import { generateRoundRobinSchedule, assignGroups, calculateStandings } from '../utils/roundrobin.js'
  import { generateSingleElimBracket, generateDoubleElimBracket, advanceBracket, getBracketWinner } from '../utils/bracket.js'
  import { validateScore, getMatchResult } from '../utils/scoring.js'
  import FrameScorer from './FrameScorer.svelte'

  const tournament = getState()

  let scoreInputs = $state({})
  let errors = $state({})
  let seriesState = $state({}) // matchId -> { games: [...], currentGame: number }
  let selectedCourt = $state(0) // 0 = All, 1..N = specific court

  const numCourts = $derived(tournament.settings.numCourts || 1)

  function roundName(ri, total) {
    if (ri === total - 1) return 'Final'
    if (ri === total - 2) return 'Semifinals'
    if (ri === total - 3) return 'Quarterfinals'
    return `Round ${ri + 1}`
  }

  // Assign courts to unplayed matches (round-robin distribution)
  function assignCourts(matches) {
    if (numCourts <= 1) return
    let courtIdx = 0
    for (const match of matches) {
      if (!match.completed && !match.court) {
        match.court = (courtIdx % numCourts) + 1
        courtIdx++
      }
    }
  }

  // Assign courts to bracket matches (first playable round)
  function assignBracketCourts() {
    if (numCourts <= 1 || !tournament.bracket) return
    const allBracketMatches = getAllBracketMatches()
    let courtIdx = 0
    for (const match of allBracketMatches) {
      if (!match.completed && match.team1Id && match.team2Id && !match.court) {
        match.court = (courtIdx % numCourts) + 1
        courtIdx++
      }
    }
  }

  // Get all bracket matches as a flat array
  function getAllBracketMatches() {
    if (!tournament.bracket) return []
    const matches = []
    for (const round of tournament.bracket.winners || []) {
      matches.push(...round.matches)
    }
    for (const round of tournament.bracket.losers || []) {
      matches.push(...round.matches)
    }
    if (tournament.bracket.finals?.matches) {
      matches.push(...tournament.bracket.finals.matches)
    }
    return matches
  }

  function teamName(id) {
    return tournament.teams.find(t => t.id === id)?.name || 'BYE'
  }

  // Determine bestOf for a match based on context
  function getBestOf(match, isFinal = false) {
    const s = tournament.settings
    // Quick mode: always Bo1
    if (s.gameMode === 'quick') return 1
    if (isFinal) return s.bestOfFinals || 1
    // Group or round-robin matches use bestOfGroup
    if (match.groupId || s.format === 'round-robin') return s.bestOfGroup || 1
    // Bracket match
    return s.bestOfPlayoff || 1
  }

  // Check if a match is the finals (last match in bracket)
  function isFinalsMatch(match) {
    if (!tournament.bracket) return false
    // Double elim: finals
    if (tournament.bracket.finals) {
      return tournament.bracket.finals.matches.some(m => m.id === match.id)
    }
    // Single elim: last round, single match
    const rounds = tournament.bracket.winners || tournament.bracket.rounds || []
    if (rounds.length > 0) {
      const lastRound = rounds[rounds.length - 1]
      return lastRound.matches.length === 1 && lastRound.matches[0].id === match.id
    }
    return false
  }

  function getMatchBestOf(match) {
    return getBestOf(match, isFinalsMatch(match))
  }

  const scoringMode = $derived(tournament.settings.defaultScoringMode || 'quick')

  // Resolve numFrames for a match based on stage (quick mode)
  function getNumFrames(match) {
    const s = tournament.settings
    if (isFinalsMatch(match)) return s.numFramesFinals || 3
    if (match.groupId || s.format === 'round-robin') return s.numFramesGroup || 3
    return s.numFramesPlayoff || 3
  }

  // Series management — read-only for templates, lazy-init from event handlers
  function getSeriesForMatch(matchId) {
    return seriesState[matchId] || { games: [], currentGame: 1 }
  }

  function ensureSeriesState(matchId) {
    if (!seriesState[matchId]) {
      seriesState[matchId] = { games: [], currentGame: 1 }
    }
    return seriesState[matchId]
  }

  function seriesWinsNeeded(bestOf) {
    return Math.ceil(bestOf / 2)
  }

  function seriesWins(series, team) {
    return series.games.filter(g => {
      if (team === 1) return g.score1 > g.score2
      return g.score2 > g.score1
    }).length
  }

  function isSeriesComplete(series, bestOf) {
    const needed = seriesWinsNeeded(bestOf)
    return seriesWins(series, 1) >= needed || seriesWins(series, 2) >= needed
  }

  // Submit a single game result (works for Bo1 or as a game within a series)
  function submitGameForMatch(match, score1, score2, isBracket, frames = null) {
    const bestOf = getMatchBestOf(match)

    if (bestOf <= 1) {
      // Simple Bo1 — same as before
      if (isBracket) {
        const result = getMatchResult({ ...match, score1, score2 })
        // Store scores on the match first, then advance
        const found = tournament.bracket.winners?.flatMap(r => r.matches)
          .concat(tournament.bracket.losers?.flatMap(r => r.matches) || [])
          .concat(tournament.bracket.finals?.matches || [])
          .find(m => m.id === match.id)
        if (found) { found.score1 = score1; found.score2 = score2 }
        advanceBracket(tournament.bracket, match.id, result.winnerId, result.loserId)
        assignBracketCourts() // assign courts to newly playable matches
        setBracket(tournament.bracket)
      } else {
        updateMatch(match.id, score1, score2)
      }
      return
    }

    // Best-of series
    const series = ensureSeriesState(match.id)
    series.games.push({ score1, score2, frames })
    series.currentGame = series.games.length + 1

    if (isSeriesComplete(series, bestOf)) {
      const w1 = seriesWins(series, 1)
      const w2 = seriesWins(series, 2)
      // Store series wins as the match scores
      if (isBracket) {
        const result = getMatchResult({ ...match, score1: w1, score2: w2 })
        const found = tournament.bracket.winners?.flatMap(r => r.matches)
          .concat(tournament.bracket.losers?.flatMap(r => r.matches) || [])
          .concat(tournament.bracket.finals?.matches || [])
          .find(m => m.id === match.id)
        if (found) { found.score1 = w1; found.score2 = w2 }
        advanceBracket(tournament.bracket, match.id, result.winnerId, result.loserId)
        assignBracketCourts()
        setBracket(tournament.bracket)
      } else {
        updateMatch(match.id, w1, w2)
      }
    }

    // Trigger reactivity
    seriesState = { ...seriesState }
  }

  function submitQuickScore(match, isBracket = false) {
    const s1 = parseInt(getScoreInput(match.id, 1))
    const s2 = parseInt(getScoreInput(match.id, 2))

    const { valid, errors: validationErrors } = validateScore(s1, s2, { ...tournament.settings, isBracket })
    if (!valid) {
      errors[match.id] = validationErrors
      return
    }
    errors[match.id] = null

    submitGameForMatch(match, s1, s2, isBracket)

    delete scoreInputs[`${match.id}-1`]
    delete scoreInputs[`${match.id}-2`]
  }

  function handleFrameComplete(match, isBracket, score1, score2, frames) {
    submitGameForMatch(match, score1, score2, isBracket, frames)
    // Reset scoring mode for next game in series
    scoringMode[match.id] = 'quick'
  }

  // Initialize matches/bracket on mount
  $effect(() => {
    const format = tournament.settings.format
    if (format === 'round-robin' && tournament.matches.length === 0) {
      const teamIds = tournament.teams.map(t => t.id)
      const schedule = generateRoundRobinSchedule(teamIds)
      const matches = schedule.flatMap(r => r.matches.map(m => ({ ...m, round: r.round })))
      assignCourts(matches)
      setMatches(matches)
    }
    if (format === 'group-playoff' && tournament.groups.length === 0) {
      const teamIds = tournament.teams.map(t => t.id)
      const groups = assignGroups(teamIds, tournament.settings.numGroups)
      setGroups(groups)
      const allMatches = []
      for (const group of groups) {
        for (const round of generateRoundRobinSchedule(group.teamIds)) {
          for (const match of round.matches) {
            allMatches.push({ ...match, round: round.round, groupId: group.id })
          }
        }
      }
      assignCourts(allMatches)
      setMatches(allMatches)
    }
    if (format === 'single-elim' && !tournament.bracket) {
      const bracket = generateSingleElimBracket(tournament.teams.map(t => t.id))
      setBracket(bracket)
    }
    if (format === 'double-elim' && !tournament.bracket) {
      const bracket = generateDoubleElimBracket(tournament.teams.map(t => t.id))
      setBracket(bracket)
    }
    // Assign courts to bracket matches
    if (tournament.bracket) {
      assignBracketCourts()
    }
  })

  // Group phase → playoff transition
  $effect(() => {
    if (tournament.settings.format === 'group-playoff' && tournament.matches.length > 0 && !tournament.bracket) {
      if (tournament.matches.every(m => m.completed)) {
        const advancingTeams = []
        for (const group of tournament.groups) {
          const groupMatches = tournament.matches.filter(m => m.groupId === group.id)
          const standings = calculateStandings(groupMatches, group.teamIds)
          advancingTeams.push(...standings.slice(0, tournament.settings.advancePerGroup).map(s => s.teamId))
        }
        if (advancingTeams.length < 2) return
        setBracket(generateSingleElimBracket(advancingTeams))
      }
    }
  })

  // Champion detection
  let allRoundRobinDone = $derived(
    tournament.settings.format === 'round-robin' &&
    tournament.matches.length > 0 &&
    tournament.matches.every(m => m.completed)
  )

  let rrStandings = $derived(() => {
    if (tournament.settings.format !== 'round-robin' || tournament.matches.length === 0) return []
    return calculateStandings(tournament.matches, tournament.teams.map(t => t.id))
  })

  $effect(() => {
    if (tournament.bracket && !tournament.champion) {
      const winner = getBracketWinner(tournament.bracket)
      if (winner) setChampion(winner)
    }
  })

  function groupStandings(group) {
    return calculateStandings(tournament.matches.filter(m => m.groupId === group.id), group.teamIds)
  }

  let rounds = $derived(() => {
    if (tournament.matches.length === 0) return []
    const roundMap = new Map()
    for (const match of tournament.matches) {
      const r = match.round || 1
      if (!roundMap.has(r)) roundMap.set(r, [])
      roundMap.get(r).push(match)
    }
    return Array.from(roundMap.entries()).sort((a, b) => a[0] - b[0]).map(([round, matches]) => ({ round, matches }))
  })

  function getScoreInput(matchId, side) {
    return scoreInputs[`${matchId}-${side}`] ?? ''
  }
  function setScoreInput(matchId, side, value) {
    scoreInputs[`${matchId}-${side}`] = value
  }

  function handleRRChampion() {
    const standings = rrStandings()
    if (standings.length > 0) setChampion(standings[0].teamId)
  }

  function filterByCourt(matches) {
    if (selectedCourt === 0 || numCourts <= 1) return matches
    return matches.filter(m => m.court === selectedCourt || m.completed)
  }

  let showCancelConfirm = $state(false)
</script>

<div class="flex-1 flex flex-col px-4 py-6 max-w-6xl mx-auto w-full">
  <h1 class="text-3xl md:text-4xl text-cornholio-gold mb-1 text-center">GAME ON!</h1>
  <p class="text-tp-cream/60 mb-6 text-center text-sm">
    {#if tournament.settings.format === 'round-robin'}
      Round Robin
    {:else if tournament.settings.format === 'group-playoff'}
      {#if tournament.bracket}Playoff Bracket{:else}Group Stage{/if}
    {:else if tournament.settings.format === 'single-elim'}
      Single Elimination
    {:else}
      Double Elimination
    {/if}
    &mdash; {tournament.settings.gameMode === 'quick'
      ? 'Quick Mode'
      : `First to ${tournament.settings.pointsToWin}`}
  </p>

  <!-- Court Tabs -->
  {#if numCourts > 1}
    <div class="flex gap-2 mb-6 overflow-x-auto no-print">
      <button
        onclick={() => selectedCourt = 0}
        class="px-4 py-2 rounded-lg text-sm font-heading transition-all cursor-pointer border-2
          {selectedCourt === 0
            ? 'bg-cornholio-gold text-cornholio-dark border-cornholio-gold'
            : 'bg-transparent text-tp-cream/60 border-cornholio-gray-light/50 hover:border-cornholio-gold/50'}"
      >
        All
      </button>
      {#each { length: numCourts } as _, i}
        {@const courtNum = i + 1}
        {@const activeCount = tournament.matches.filter(m => m.court === courtNum && !m.completed).length}
        <button
          onclick={() => selectedCourt = courtNum}
          class="px-4 py-2 rounded-lg text-sm font-heading transition-all cursor-pointer border-2
            {selectedCourt === courtNum
              ? 'bg-cornholio-gold text-cornholio-dark border-cornholio-gold'
              : 'bg-transparent text-tp-cream/60 border-cornholio-gray-light/50 hover:border-cornholio-gold/50'}"
        >
          Court {courtNum}
          {#if activeCount > 0}
            <span class="ml-1 text-xs opacity-70">({activeCount})</span>
          {/if}
        </button>
      {/each}
    </div>
  {/if}

  <!-- ROUND ROBIN -->
  {#if tournament.settings.format === 'round-robin'}
    <div class="space-y-6 mb-8">
      {#each rounds() as { round, matches }}
        <div>
          <h2 class="text-xl text-cornholio-gold mb-3">Round {round}</h2>
          <div class="space-y-3">
            {#each filterByCourt(matches) as match}
              {@render matchEntry(match, false)}
            {/each}
          </div>
        </div>
      {/each}
    </div>

    {#if rrStandings().length > 0}
      <div class="mb-8">
        <h2 class="text-xl text-cornholio-gold mb-3">Standings</h2>
        {@render standingsTable(rrStandings(), allRoundRobinDone)}
      </div>
    {/if}

    {#if allRoundRobinDone && !tournament.champion}
      <div class="text-center">
        <button onclick={handleRRChampion}
          class="bg-cornholio-gold text-cornholio-dark font-heading text-2xl px-10 py-3 rounded-lg
            hover:bg-cornholio-gold-light hover:scale-105 transition-all cursor-pointer shadow-lg">
          CROWN THE CHAMPION
        </button>
      </div>
    {/if}

  <!-- GROUP + PLAYOFF -->
  {:else if tournament.settings.format === 'group-playoff'}
    {#if !tournament.bracket}
      {#each tournament.groups as group}
        <div class="mb-8">
          <h2 class="text-xl text-cornholio-gold mb-3">{group.name}</h2>
          <div class="space-y-3 mb-4">
            {#each filterByCourt(tournament.matches.filter(m => m.groupId === group.id)) as match}
              {@render matchEntry(match, false)}
            {/each}
          </div>
          {@render standingsTable(groupStandings(group), false, tournament.settings.advancePerGroup)}
        </div>
      {/each}
    {:else}
      <h2 class="text-xl text-cornholio-gold mb-4">Playoff Bracket</h2>
      {@render bracketView(tournament.bracket)}
    {/if}

  <!-- SINGLE ELIMINATION -->
  {:else if tournament.settings.format === 'single-elim' && tournament.bracket}
    {@render bracketView(tournament.bracket)}

  <!-- DOUBLE ELIMINATION -->
  {:else if tournament.settings.format === 'double-elim' && tournament.bracket}
    {#if tournament.bracket.winners}
      <h2 class="text-xl text-cornholio-gold mb-3">Winners Bracket</h2>
      {@render bracketRounds(tournament.bracket.winners)}
    {/if}
    {#if tournament.bracket.losers?.length > 0}
      <h2 class="text-xl text-cornholio-gold mb-3 mt-6">Losers Bracket</h2>
      {@render bracketRounds(tournament.bracket.losers)}
    {/if}
    {#if tournament.bracket.finals}
      <h2 class="text-xl text-cornholio-gold mb-3 mt-6">Grand Finals</h2>
      {@render bracketRounds([tournament.bracket.finals])}
    {/if}
  {/if}

  <!-- Champion -->
  {#if tournament.champion}
    <div class="mt-8 text-center">
      <p class="text-2xl text-cornholio-gold mb-4 font-heading">Champion: {teamName(tournament.champion)}!</p>
      <button onclick={() => setStep('results')}
        class="bg-cornholio-gold text-cornholio-dark font-heading text-2xl px-10 py-3 rounded-lg
          hover:bg-cornholio-gold-light hover:scale-105 transition-all cursor-pointer shadow-lg">
        VIEW RESULTS
      </button>
    </div>
  {/if}

  <!-- Cancel -->
  <div class="mt-12 pt-6 border-t border-cornholio-gray-light/20 text-center no-print">
    <button onclick={() => showCancelConfirm = true}
      class="text-cornholio-red/60 hover:text-cornholio-red text-sm cursor-pointer bg-transparent border-none underline">
      Cancel Tournament
    </button>
  </div>

  {#if showCancelConfirm}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div class="bg-cornholio-blue border-2 border-cornholio-gold/50 rounded-xl p-6 max-w-sm mx-4 text-center">
        <h3 class="text-xl text-cornholio-gold font-heading mb-3">CANCEL TOURNAMENT?</h3>
        <p class="text-tp-cream/70 text-sm mb-6">All match results will be lost. You'll return to team pairing.</p>
        <div class="flex gap-3 justify-center">
          <button onclick={() => showCancelConfirm = false}
            class="bg-cornholio-gray text-tp-cream font-heading px-6 py-2 rounded-lg hover:bg-cornholio-gray-light transition-all cursor-pointer border border-cornholio-gray-light">
            KEEP PLAYING
          </button>
          <button onclick={cancelTournament}
            class="bg-cornholio-red text-white font-heading px-6 py-2 rounded-lg hover:bg-cornholio-red/80 transition-all cursor-pointer">
            CANCEL
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- ========== SNIPPETS ========== -->

<!-- Match entry: handles Bo1 and series, quick and frame modes -->
{#snippet matchEntry(match, isBracket)}
  {@const bestOf = getMatchBestOf(match)}
  {@const series = bestOf > 1 ? getSeriesForMatch(match.id) : null}
  {@const seriesDone = series ? isSeriesComplete(series, bestOf) : false}

  <div class="bg-cornholio-navy/50 rounded-lg p-3">
    {#if numCourts > 1 && match.court && !isBracket}
      <div class="text-[10px] text-cornholio-gold/50 mb-1">Court {match.court}</div>
    {/if}
    {#if match.completed}
      <!-- Completed match -->
      {@const isDraw = match.score1 === match.score2}
      <div class="flex flex-wrap items-center gap-2">
        <span class="flex-1 text-right {isDraw ? 'text-tp-cream' : match.score1 > match.score2 ? 'text-cornholio-gold font-bold' : 'text-tp-cream/70'}">
          {teamName(match.team1Id)}
        </span>
        <span class="px-3 text-tp-white font-bold tabular-nums">
          {match.score1} - {match.score2}
          {#if isDraw}<span class="text-tp-cream/40 text-xs ml-1">DRAW</span>{/if}
        </span>
        <span class="flex-1 {isDraw ? 'text-tp-cream' : match.score2 > match.score1 ? 'text-cornholio-gold font-bold' : 'text-tp-cream/70'}">
          {teamName(match.team2Id)}
        </span>
        {#if bestOf > 1}
          <span class="w-full text-center text-tp-cream/40 text-xs">Series (Bo{bestOf})</span>
        {/if}
      </div>
    {:else if bestOf > 1 && !seriesDone}
      <!-- Active series -->
      {@const w1 = series ? seriesWins(series, 1) : 0}
      {@const w2 = series ? seriesWins(series, 2) : 0}
      {@const gameNum = series ? series.games.length + 1 : 1}
      {@const needed = seriesWinsNeeded(bestOf)}

      <div class="mb-3">
        <div class="flex items-center justify-between text-sm">
          <span class="text-tp-cream">{teamName(match.team1Id)}</span>
          <span class="text-cornholio-gold font-heading">
            Bo{bestOf} &mdash; Game {gameNum}
          </span>
          <span class="text-tp-cream">{teamName(match.team2Id)}</span>
        </div>
        <div class="flex items-center justify-between mt-1">
          <div class="flex gap-1">
            {#each { length: needed } as _, i}
              <div class="w-4 h-4 rounded-full border border-cornholio-gold/50
                {i < w1 ? 'bg-cornholio-gold' : 'bg-transparent'}"></div>
            {/each}
          </div>
          <span class="text-tp-cream/50 text-xs">First to {needed}</span>
          <div class="flex gap-1">
            {#each { length: needed } as _, i}
              <div class="w-4 h-4 rounded-full border border-cornholio-gold/50
                {i < w2 ? 'bg-cornholio-gold' : 'bg-transparent'}"></div>
            {/each}
          </div>
        </div>
        {#if series && series.games.length > 0}
          <div class="mt-2 flex gap-2 justify-center">
            {#each series.games as game, gi}
              <span class="text-xs text-tp-cream/40 bg-cornholio-dark/50 rounded px-2 py-0.5">
                G{gi + 1}: {game.score1}-{game.score2}
              </span>
            {/each}
          </div>
        {/if}
      </div>

      {@render gameScoreEntry(match, isBracket)}

    {:else}
      <!-- Bo1 or ready to score -->
      {@render gameScoreEntry(match, isBracket)}
    {/if}

    {#if errors[match.id]}
      <div class="text-cornholio-red text-xs mt-2">{errors[match.id].join(', ')}</div>
    {/if}
  </div>
{/snippet}

<!-- Single game score entry (mode set at tournament level) -->
{#snippet gameScoreEntry(match, isBracket)}
  {#if scoringMode === 'frames'}
    <FrameScorer
      team1Name={teamName(match.team1Id)}
      team2Name={teamName(match.team2Id)}
      settings={{ ...tournament.settings, isBracket, numFrames: getNumFrames(match) }}
      onGameComplete={(s1, s2, frames) => handleFrameComplete(match, isBracket, s1, s2, frames)}
    />
  {:else}
    <div class="flex items-center justify-center gap-2">
      <div class="text-center min-w-0">
        <div class="text-tp-cream text-xs mb-1 truncate">{teamName(match.team1Id)}</div>
        <input type="number" min="0"
          value={getScoreInput(match.id, 1)}
          oninput={(e) => setScoreInput(match.id, 1, e.target.value)}
          class="w-16 bg-cornholio-dark border border-cornholio-gold/50 rounded px-2 py-1 text-cornholio-gold text-center" />
      </div>
      <span class="text-tp-cream/50 text-sm mt-4">vs</span>
      <div class="text-center min-w-0">
        <div class="text-tp-cream text-xs mb-1 truncate">{teamName(match.team2Id)}</div>
        <input type="number" min="0"
          value={getScoreInput(match.id, 2)}
          oninput={(e) => setScoreInput(match.id, 2, e.target.value)}
          class="w-16 bg-cornholio-dark border border-cornholio-gold/50 rounded px-2 py-1 text-cornholio-gold text-center" />
      </div>
      <button onclick={() => submitQuickScore(match, isBracket)}
        class="bg-cornholio-gold text-cornholio-dark font-heading px-4 py-1 rounded mt-4
          hover:bg-cornholio-gold-light transition-colors cursor-pointer text-sm">
        Submit
      </button>
    </div>
  {/if}
{/snippet}

<!-- Standings table -->
{#snippet standingsTable(rows, highlight = false, advanceCount = 0)}
  {@const isQuickMode = tournament.settings.gameMode === 'quick'}
  <div class="overflow-x-auto">
    <table class="w-full border-collapse text-sm">
      <thead>
        <tr class="bg-cornholio-gray/50 text-tp-cream/80">
          <th class="text-left px-3 py-2 border border-cornholio-gray-light/30">#</th>
          <th class="text-left px-3 py-2 border border-cornholio-gray-light/30">Team</th>
          {#if isQuickMode}
            <th class="text-center px-3 py-2 border border-cornholio-gray-light/30">Pts</th>
          {/if}
          <th class="text-center px-3 py-2 border border-cornholio-gray-light/30">W</th>
          {#if isQuickMode}
            <th class="text-center px-3 py-2 border border-cornholio-gray-light/30">D</th>
          {/if}
          <th class="text-center px-3 py-2 border border-cornholio-gray-light/30">L</th>
          <th class="text-center px-3 py-2 border border-cornholio-gray-light/30">PF</th>
          <th class="text-center px-3 py-2 border border-cornholio-gray-light/30">PA</th>
          <th class="text-center px-3 py-2 border border-cornholio-gray-light/30">Diff</th>
        </tr>
      </thead>
      <tbody>
        {#each rows as row, i}
          <tr class="border-b border-cornholio-gray-light/20
            {(i === 0 && highlight) || (advanceCount > 0 && i < advanceCount) ? 'bg-cornholio-gold/10' : ''}">
            <td class="px-3 py-2 text-tp-cream/50 border border-cornholio-gray-light/30">{i + 1}</td>
            <td class="px-3 py-2 border border-cornholio-gray-light/30
              {(i === 0 && highlight) || (advanceCount > 0 && i < advanceCount) ? 'text-cornholio-gold font-bold' : 'text-tp-white'}">
              {teamName(row.teamId)}
            </td>
            {#if isQuickMode}
              <td class="text-center px-3 py-2 border border-cornholio-gray-light/30 text-cornholio-gold font-bold">{row.points}</td>
            {/if}
            <td class="text-center px-3 py-2 border border-cornholio-gray-light/30 text-tp-white">{row.wins}</td>
            {#if isQuickMode}
              <td class="text-center px-3 py-2 border border-cornholio-gray-light/30 text-tp-cream/70">{row.draws}</td>
            {/if}
            <td class="text-center px-3 py-2 border border-cornholio-gray-light/30 text-tp-cream/70">{row.losses}</td>
            <td class="text-center px-3 py-2 border border-cornholio-gray-light/30 text-tp-cream/70">{row.pointsFor}</td>
            <td class="text-center px-3 py-2 border border-cornholio-gray-light/30 text-tp-cream/70">{row.pointsAgainst}</td>
            <td class="text-center px-3 py-2 border border-cornholio-gray-light/30
              {row.differential > 0 ? 'text-cornholio-gold' : row.differential < 0 ? 'text-cornholio-red' : 'text-tp-cream/70'}">
              {row.differential > 0 ? '+' : ''}{row.differential}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/snippet}

<!-- Bracket view — centered finals layout -->
{#snippet bracketView(bracket)}
  {@const rounds = bracket.winners || bracket.rounds || (Array.isArray(bracket) ? bracket : [])}
  {#if rounds.length === 0}
    <div class="text-tp-cream/30 italic">No bracket data</div>
  {:else if rounds.length === 1}
    <!-- Single round (just the final) -->
    <div class="flex justify-center min-w-[200px] max-w-[320px] flex-1">
      <div>
        <h4 class="text-sm text-cornholio-gold font-heading text-center mb-2">Final</h4>
        {#each rounds[0].matches as match}
          {@render bracketMatchCard(match)}
        {/each}
      </div>
    </div>
  {:else}
    <!-- MOBILE: vertical stack of rounds -->
    <div class="flex flex-col gap-4 md:hidden pb-4">
      {#each rounds as round, ri}
        <div>
          <h4 class="text-xs text-cornholio-gold/50 font-heading text-center mb-2">
            {round.name || roundName(ri, rounds.length)}
          </h4>
          <div class="flex flex-col gap-3 max-w-sm mx-auto">
            {#each round.matches as match}
              {@render bracketMatchCard(match)}
            {/each}
          </div>
        </div>
      {/each}
    </div>

    <!-- DESKTOP: left-to-right bracket flow -->
    <div class="hidden md:flex gap-4 overflow-x-auto pb-4">
      {#each rounds as round, ri}
        <div class="flex flex-col gap-3 min-w-[200px] max-w-[320px] flex-1">
          <h4 class="text-xs text-cornholio-gold/50 font-heading text-center">
            {round.name || roundName(ri, rounds.length)}
          </h4>
          {#each round.matches as match}
            {@render bracketMatchCard(match)}
          {/each}
        </div>
      {/each}
    </div>
  {/if}
{/snippet}

<!-- Single bracket match card -->
{#snippet bracketMatchCard(match)}
  <div class="bg-cornholio-navy/50 border border-cornholio-gray-light/30 rounded-lg p-3 w-full max-w-sm
    {!match.completed && match.team1Id && match.team2Id ? 'border-cornholio-gold/30' : ''}
    {selectedCourt > 0 && match.court && match.court !== selectedCourt && !match.completed ? 'opacity-30' : ''}">
    {#if numCourts > 1 && match.court}
      <div class="text-[10px] text-cornholio-gold/50 mb-1">Court {match.court}</div>
    {/if}
    {#if match.completed && match.team1Id && match.team2Id}
      {@render matchEntry(match, true)}
    {:else if match.completed}
      <!-- Bye: auto-advanced -->
      <div class="text-tp-cream/50 text-sm py-1">
        {teamName(match.team1Id || match.team2Id)} — bye
      </div>
    {:else if match.team1Id && match.team2Id}
      {@render matchEntry(match, true)}
    {:else if match.team1Id || match.team2Id}
      <div class="text-tp-cream/50 text-sm py-1">
        {teamName(match.team1Id || match.team2Id)} — waiting for opponent...
      </div>
    {:else}
      <div class="text-tp-cream/30 text-sm italic py-2">Waiting for teams...</div>
    {/if}
  </div>
{/snippet}

<!-- Legacy bracket rounds for double-elim (still left-to-right) -->
{#snippet bracketRounds(rounds)}
  <!-- MOBILE: vertical stack -->
  <div class="flex flex-col gap-4 md:hidden pb-4">
    {#each rounds as round, ri}
      <div>
        <h3 class="text-sm text-cornholio-gold/70 font-heading text-center mb-2">{round.name || roundName(ri, rounds.length)}</h3>
        <div class="flex flex-col gap-3 max-w-sm mx-auto">
          {#each round.matches as match}
            {@render bracketMatchCard(match)}
          {/each}
        </div>
      </div>
    {/each}
  </div>
  <!-- DESKTOP: horizontal flow -->
  <div class="hidden md:flex gap-4 overflow-x-auto pb-4">
    {#each rounds as round, ri}
      <div class="flex flex-col gap-4 min-w-[200px] max-w-[320px] flex-1">
        <h3 class="text-sm text-cornholio-gold/70 font-heading">{round.name || roundName(ri, rounds.length)}</h3>
        {#each round.matches as match}
          {@render bracketMatchCard(match)}
        {/each}
      </div>
    {/each}
  </div>
{/snippet}
