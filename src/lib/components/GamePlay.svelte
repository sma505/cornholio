<script>
  import { getState, setMatches, setGroups, setBracket, updateMatch, setStep, setChampion } from '../stores/tournament.svelte.js'
  import { generateRoundRobinSchedule, assignGroups, calculateStandings } from '../utils/roundrobin.js'
  import { generateSingleElimBracket, generateDoubleElimBracket, advanceBracket, getBracketWinner } from '../utils/bracket.js'
  import { validateScore, getMatchResult } from '../utils/scoring.js'

  const tournament = getState()

  let scoreInputs = $state({})
  let errors = $state({})
  let groupPhaseComplete = $state(false)

  function teamName(id) {
    return tournament.teams.find(t => t.id === id)?.name || 'BYE'
  }

  // Initialize matches/bracket on mount based on format
  $effect(() => {
    const format = tournament.settings.format

    if (format === 'round-robin' && tournament.matches.length === 0) {
      const teamIds = tournament.teams.map(t => t.id)
      const schedule = generateRoundRobinSchedule(teamIds)
      const allMatches = schedule.flatMap(r =>
        r.matches.map(m => ({ ...m, round: r.round }))
      )
      setMatches(allMatches)
    }

    if (format === 'group-playoff' && tournament.groups.length === 0) {
      const teamIds = tournament.teams.map(t => t.id)
      const groups = assignGroups(teamIds, tournament.settings.numGroups)
      setGroups(groups)
      const allMatches = []
      for (const group of groups) {
        const schedule = generateRoundRobinSchedule(group.teamIds)
        for (const round of schedule) {
          for (const match of round.matches) {
            allMatches.push({ ...match, round: round.round, groupId: group.id })
          }
        }
      }
      setMatches(allMatches)
    }

    if (format === 'single-elim' && !tournament.bracket) {
      const teamIds = tournament.teams.map(t => t.id)
      const bracket = generateSingleElimBracket(teamIds)
      setBracket(bracket)
    }

    if (format === 'double-elim' && !tournament.bracket) {
      const teamIds = tournament.teams.map(t => t.id)
      const bracket = generateDoubleElimBracket(teamIds)
      setBracket(bracket)
    }
  })

  // Detect when group phase is done and generate playoff bracket
  $effect(() => {
    if (tournament.settings.format === 'group-playoff' && tournament.matches.length > 0 && !tournament.bracket) {
      const allDone = tournament.matches.every(m => m.completed)
      if (allDone) {
        groupPhaseComplete = true
        const advancingTeams = []
        for (const group of tournament.groups) {
          const groupMatches = tournament.matches.filter(m => m.groupId === group.id)
          const standings = calculateStandings(groupMatches, group.teamIds)
          const advancing = standings.slice(0, tournament.settings.advancePerGroup)
          advancingTeams.push(...advancing.map(s => s.teamId))
        }
        const bracket = generateSingleElimBracket(advancingTeams)
        setBracket(bracket)
      }
    }
  })

  // Detect champion for round-robin
  let allRoundRobinDone = $derived(
    tournament.settings.format === 'round-robin' &&
    tournament.matches.length > 0 &&
    tournament.matches.every(m => m.completed)
  )

  let rrStandings = $derived(() => {
    if (tournament.settings.format !== 'round-robin' || tournament.matches.length === 0) return []
    const teamIds = tournament.teams.map(t => t.id)
    return calculateStandings(tournament.matches, teamIds)
  })

  // Bracket winner detection for elim formats
  $effect(() => {
    if (tournament.bracket && !tournament.champion) {
      const winner = getBracketWinner(tournament.bracket)
      if (winner) {
        setChampion(winner)
      }
    }
  })

  // Group standings per group
  function groupStandings(group) {
    const groupMatches = tournament.matches.filter(m => m.groupId === group.id)
    return calculateStandings(groupMatches, group.teamIds)
  }

  // Get rounds from round-robin matches
  let rounds = $derived(() => {
    if (tournament.matches.length === 0) return []
    const roundMap = new Map()
    for (const match of tournament.matches) {
      const r = match.round || 1
      if (!roundMap.has(r)) roundMap.set(r, [])
      roundMap.get(r).push(match)
    }
    return Array.from(roundMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([round, matches]) => ({ round, matches }))
  })

  function getScoreInput(matchId, side) {
    return scoreInputs[`${matchId}-${side}`] ?? ''
  }

  function setScoreInput(matchId, side, value) {
    scoreInputs[`${matchId}-${side}`] = value
  }

  function submitScore(match) {
    const s1 = parseInt(getScoreInput(match.id, 1))
    const s2 = parseInt(getScoreInput(match.id, 2))

    const { valid, errors: validationErrors } = validateScore(s1, s2, tournament.settings)
    if (!valid) {
      errors[match.id] = validationErrors
      return
    }
    errors[match.id] = null

    updateMatch(match.id, s1, s2)

    // Clear inputs
    delete scoreInputs[`${match.id}-1`]
    delete scoreInputs[`${match.id}-2`]
  }

  function submitBracketScore(match) {
    const s1 = parseInt(getScoreInput(match.id, 1))
    const s2 = parseInt(getScoreInput(match.id, 2))

    const { valid, errors: validationErrors } = validateScore(s1, s2, tournament.settings)
    if (!valid) {
      errors[match.id] = validationErrors
      return
    }
    errors[match.id] = null

    const result = getMatchResult({ ...match, score1: s1, score2: s2 })
    advanceBracket(tournament.bracket, match.id, s1, s2, result.winnerId, result.loserId)
    setBracket(tournament.bracket)

    delete scoreInputs[`${match.id}-1`]
    delete scoreInputs[`${match.id}-2`]
  }

  function handleRRChampion() {
    const standings = rrStandings()
    if (standings.length > 0) {
      setChampion(standings[0].teamId)
    }
  }

  function viewResults() {
    setStep('results')
  }
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
    &mdash; First to {tournament.settings.pointsToWin}
  </p>

  <!-- ROUND ROBIN -->
  {#if tournament.settings.format === 'round-robin'}
    <div class="space-y-6 mb-8">
      {#each rounds() as { round, matches }}
        <div>
          <h2 class="text-xl text-cornholio-gold mb-3">Round {round}</h2>
          <div class="space-y-2">
            {#each matches as match}
              <div class="bg-cornholio-navy/50 rounded-lg p-3 flex flex-wrap items-center gap-2">
                {#if match.completed}
                  <span class="flex-1 text-right {match.score1 > match.score2 ? 'text-cornholio-gold font-bold' : 'text-tp-cream/70'}">
                    {teamName(match.team1Id)}
                  </span>
                  <span class="px-3 text-tp-white font-bold tabular-nums">
                    {match.score1} - {match.score2}
                  </span>
                  <span class="flex-1 {match.score2 > match.score1 ? 'text-cornholio-gold font-bold' : 'text-tp-cream/70'}">
                    {teamName(match.team2Id)}
                  </span>
                {:else}
                  <span class="flex-1 text-right text-tp-cream">{teamName(match.team1Id)}</span>
                  <input
                    type="number"
                    min="0"
                    value={getScoreInput(match.id, 1)}
                    oninput={(e) => setScoreInput(match.id, 1, e.target.value)}
                    class="w-16 bg-cornholio-dark border border-cornholio-gold/50 rounded px-2 py-1
                      text-cornholio-gold text-center"
                  />
                  <span class="text-tp-cream/50 text-sm">vs</span>
                  <input
                    type="number"
                    min="0"
                    value={getScoreInput(match.id, 2)}
                    oninput={(e) => setScoreInput(match.id, 2, e.target.value)}
                    class="w-16 bg-cornholio-dark border border-cornholio-gold/50 rounded px-2 py-1
                      text-cornholio-gold text-center"
                  />
                  <span class="flex-1 text-tp-cream">{teamName(match.team2Id)}</span>
                  <button
                    onclick={() => submitScore(match)}
                    class="bg-cornholio-gold text-cornholio-dark font-heading px-4 py-1 rounded
                      hover:bg-cornholio-gold-light transition-colors cursor-pointer text-sm"
                  >
                    Submit
                  </button>
                {/if}
                {#if errors[match.id]}
                  <div class="w-full text-cornholio-red text-xs mt-1">
                    {errors[match.id].join(', ')}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>

    <!-- Standings Table -->
    {#if rrStandings().length > 0}
      <div class="mb-8">
        <h2 class="text-xl text-cornholio-gold mb-3">Standings</h2>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-cornholio-gray/50 text-tp-cream/80 text-sm">
                <th class="text-left px-3 py-2 border border-cornholio-gray-light/30">#</th>
                <th class="text-left px-3 py-2 border border-cornholio-gray-light/30">Team</th>
                <th class="text-center px-3 py-2 border border-cornholio-gray-light/30">W</th>
                <th class="text-center px-3 py-2 border border-cornholio-gray-light/30">L</th>
                <th class="text-center px-3 py-2 border border-cornholio-gray-light/30">PF</th>
                <th class="text-center px-3 py-2 border border-cornholio-gray-light/30">PA</th>
                <th class="text-center px-3 py-2 border border-cornholio-gray-light/30">Diff</th>
              </tr>
            </thead>
            <tbody>
              {#each rrStandings() as row, i}
                <tr class="border-b border-cornholio-gray-light/20 {i === 0 && allRoundRobinDone ? 'bg-cornholio-gold/10' : ''}">
                  <td class="px-3 py-2 text-tp-cream/50 border border-cornholio-gray-light/30">{i + 1}</td>
                  <td class="px-3 py-2 border border-cornholio-gray-light/30 {i === 0 && allRoundRobinDone ? 'text-cornholio-gold font-bold' : 'text-tp-white'}">
                    {teamName(row.teamId)}
                  </td>
                  <td class="text-center px-3 py-2 border border-cornholio-gray-light/30 text-tp-white">{row.wins}</td>
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
      </div>
    {/if}

    {#if allRoundRobinDone && !tournament.champion}
      <div class="text-center">
        <button
          onclick={handleRRChampion}
          class="bg-cornholio-gold text-cornholio-dark font-heading text-2xl px-10 py-3 rounded-lg
            hover:bg-cornholio-gold-light hover:scale-105 transition-all cursor-pointer shadow-lg"
        >
          CROWN THE CHAMPION
        </button>
      </div>
    {/if}

  <!-- GROUP + PLAYOFF -->
  {:else if tournament.settings.format === 'group-playoff'}
    {#if !tournament.bracket}
      <!-- Group Stage -->
      {#each tournament.groups as group}
        <div class="mb-8">
          <h2 class="text-xl text-cornholio-gold mb-3">{group.name}</h2>
          <div class="space-y-2 mb-4">
            {#each tournament.matches.filter(m => m.groupId === group.id) as match}
              <div class="bg-cornholio-navy/50 rounded-lg p-3 flex flex-wrap items-center gap-2">
                {#if match.completed}
                  <span class="flex-1 text-right {match.score1 > match.score2 ? 'text-cornholio-gold font-bold' : 'text-tp-cream/70'}">
                    {teamName(match.team1Id)}
                  </span>
                  <span class="px-3 text-tp-white font-bold tabular-nums">
                    {match.score1} - {match.score2}
                  </span>
                  <span class="flex-1 {match.score2 > match.score1 ? 'text-cornholio-gold font-bold' : 'text-tp-cream/70'}">
                    {teamName(match.team2Id)}
                  </span>
                {:else}
                  <span class="flex-1 text-right text-tp-cream">{teamName(match.team1Id)}</span>
                  <input
                    type="number"
                    min="0"
                    value={getScoreInput(match.id, 1)}
                    oninput={(e) => setScoreInput(match.id, 1, e.target.value)}
                    class="w-16 bg-cornholio-dark border border-cornholio-gold/50 rounded px-2 py-1
                      text-cornholio-gold text-center"
                  />
                  <span class="text-tp-cream/50 text-sm">vs</span>
                  <input
                    type="number"
                    min="0"
                    value={getScoreInput(match.id, 2)}
                    oninput={(e) => setScoreInput(match.id, 2, e.target.value)}
                    class="w-16 bg-cornholio-dark border border-cornholio-gold/50 rounded px-2 py-1
                      text-cornholio-gold text-center"
                  />
                  <span class="flex-1 text-tp-cream">{teamName(match.team2Id)}</span>
                  <button
                    onclick={() => submitScore(match)}
                    class="bg-cornholio-gold text-cornholio-dark font-heading px-4 py-1 rounded
                      hover:bg-cornholio-gold-light transition-colors cursor-pointer text-sm"
                  >
                    Submit
                  </button>
                {/if}
                {#if errors[match.id]}
                  <div class="w-full text-cornholio-red text-xs mt-1">
                    {errors[match.id].join(', ')}
                  </div>
                {/if}
              </div>
            {/each}
          </div>

          <!-- Group Standings -->
          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="bg-cornholio-gray/50 text-tp-cream/80">
                  <th class="text-left px-2 py-1 border border-cornholio-gray-light/30">#</th>
                  <th class="text-left px-2 py-1 border border-cornholio-gray-light/30">Team</th>
                  <th class="text-center px-2 py-1 border border-cornholio-gray-light/30">W</th>
                  <th class="text-center px-2 py-1 border border-cornholio-gray-light/30">L</th>
                  <th class="text-center px-2 py-1 border border-cornholio-gray-light/30">PF</th>
                  <th class="text-center px-2 py-1 border border-cornholio-gray-light/30">PA</th>
                  <th class="text-center px-2 py-1 border border-cornholio-gray-light/30">Diff</th>
                </tr>
              </thead>
              <tbody>
                {#each groupStandings(group) as row, i}
                  <tr class="border-b border-cornholio-gray-light/20
                    {i < tournament.settings.advancePerGroup ? 'bg-cornholio-gold/5' : ''}">
                    <td class="px-2 py-1 text-tp-cream/50 border border-cornholio-gray-light/30">{i + 1}</td>
                    <td class="px-2 py-1 border border-cornholio-gray-light/30
                      {i < tournament.settings.advancePerGroup ? 'text-cornholio-gold' : 'text-tp-white'}">
                      {teamName(row.teamId)}
                    </td>
                    <td class="text-center px-2 py-1 border border-cornholio-gray-light/30 text-tp-white">{row.wins}</td>
                    <td class="text-center px-2 py-1 border border-cornholio-gray-light/30 text-tp-cream/70">{row.losses}</td>
                    <td class="text-center px-2 py-1 border border-cornholio-gray-light/30 text-tp-cream/70">{row.pointsFor}</td>
                    <td class="text-center px-2 py-1 border border-cornholio-gray-light/30 text-tp-cream/70">{row.pointsAgainst}</td>
                    <td class="text-center px-2 py-1 border border-cornholio-gray-light/30
                      {row.differential > 0 ? 'text-cornholio-gold' : row.differential < 0 ? 'text-cornholio-red' : 'text-tp-cream/70'}">
                      {row.differential > 0 ? '+' : ''}{row.differential}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/each}
    {:else}
      <!-- Playoff Bracket -->
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
    {#if tournament.bracket.losers && tournament.bracket.losers.length > 0}
      <h2 class="text-xl text-cornholio-gold mb-3 mt-6">Losers Bracket</h2>
      {@render bracketRounds(tournament.bracket.losers)}
    {/if}
    {#if tournament.bracket.finals}
      <h2 class="text-xl text-cornholio-gold mb-3 mt-6">Grand Finals</h2>
      {@render bracketRounds([tournament.bracket.finals])}
    {/if}
  {/if}

  <!-- Champion detected - View Results -->
  {#if tournament.champion}
    <div class="mt-8 text-center">
      <p class="text-2xl text-cornholio-gold mb-4 font-heading">
        Champion: {teamName(tournament.champion)}!
      </p>
      <button
        onclick={viewResults}
        class="bg-cornholio-gold text-cornholio-dark font-heading text-2xl px-10 py-3 rounded-lg
          hover:bg-cornholio-gold-light hover:scale-105 transition-all cursor-pointer shadow-lg"
      >
        VIEW RESULTS
      </button>
    </div>
  {/if}
</div>

<!-- Bracket view snippet -->
{#snippet bracketView(bracket)}
  {#if bracket.winners}
    {@render bracketRounds(bracket.winners)}
  {:else if bracket.rounds}
    {@render bracketRounds(bracket.rounds)}
  {:else if Array.isArray(bracket)}
    {@render bracketRounds(bracket)}
  {/if}
{/snippet}

<!-- Bracket rounds rendered left-to-right -->
{#snippet bracketRounds(rounds)}
  <div class="flex gap-4 overflow-x-auto pb-4">
    {#each rounds as round, ri}
      <div class="flex flex-col gap-4 min-w-[260px]">
        <h3 class="text-sm text-cornholio-gold/70 font-heading">
          {round.name || `Round ${ri + 1}`}
        </h3>
        {#each round.matches as match}
          <div class="bg-cornholio-navy/50 border border-cornholio-gray-light/30 rounded-lg p-3
            {match.completed ? '' : 'border-cornholio-gold/30'}">
            {#if match.team1Id && match.team2Id}
              {#if match.completed}
                <div class="flex justify-between items-center mb-1
                  {match.score1 > match.score2 ? 'text-cornholio-gold font-bold' : 'text-tp-cream/60'}">
                  <span class="truncate mr-2">{teamName(match.team1Id)}</span>
                  <span class="tabular-nums">{match.score1}</span>
                </div>
                <div class="flex justify-between items-center
                  {match.score2 > match.score1 ? 'text-cornholio-gold font-bold' : 'text-tp-cream/60'}">
                  <span class="truncate mr-2">{teamName(match.team2Id)}</span>
                  <span class="tabular-nums">{match.score2}</span>
                </div>
              {:else}
                <div class="space-y-2">
                  <div class="flex items-center gap-2">
                    <span class="flex-1 text-tp-cream text-sm truncate">{teamName(match.team1Id)}</span>
                    <input
                      type="number"
                      min="0"
                      value={getScoreInput(match.id, 1)}
                      oninput={(e) => setScoreInput(match.id, 1, e.target.value)}
                      class="w-14 bg-cornholio-dark border border-cornholio-gold/50 rounded px-2 py-1
                        text-cornholio-gold text-center text-sm"
                    />
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="flex-1 text-tp-cream text-sm truncate">{teamName(match.team2Id)}</span>
                    <input
                      type="number"
                      min="0"
                      value={getScoreInput(match.id, 2)}
                      oninput={(e) => setScoreInput(match.id, 2, e.target.value)}
                      class="w-14 bg-cornholio-dark border border-cornholio-gold/50 rounded px-2 py-1
                        text-cornholio-gold text-center text-sm"
                    />
                  </div>
                  <button
                    onclick={() => submitBracketScore(match)}
                    class="w-full bg-cornholio-gold text-cornholio-dark font-heading px-3 py-1 rounded
                      hover:bg-cornholio-gold-light transition-colors cursor-pointer text-sm"
                  >
                    Submit
                  </button>
                  {#if errors[match.id]}
                    <div class="text-cornholio-red text-xs">
                      {errors[match.id].join(', ')}
                    </div>
                  {/if}
                </div>
              {/if}
            {:else}
              <div class="text-tp-cream/30 text-sm italic py-2">Waiting for teams...</div>
            {/if}
          </div>
        {/each}
      </div>
      {#if ri < rounds.length - 1}
        <div class="flex flex-col justify-around py-8">
          {#each { length: Math.max(1, Math.ceil(round.matches.length / 2)) } as _}
            <div class="w-4 border-t-2 border-cornholio-gold/30 my-4"></div>
          {/each}
        </div>
      {/if}
    {/each}
  </div>
{/snippet}
