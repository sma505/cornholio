<script>
  import { getState, goHome } from '../stores/tournament.svelte.js'
  import { exportTournament } from '../utils/persistence.js'
  import { calculateStandings } from '../utils/roundrobin.js'

  const tournament = getState()

  let showCelebration = $state(true)

  $effect(() => {
    const timer = setTimeout(() => {
      showCelebration = false
    }, 3000)
    return () => clearTimeout(timer)
  })

  function teamName(id) {
    return tournament.teams.find(t => t.id === id)?.name || 'Unknown'
  }

  let championName = $derived(tournament.champion ? teamName(tournament.champion) : '')

  let standings = $derived(() => {
    if (tournament.settings.format === 'round-robin') {
      const teamIds = tournament.teams.map(t => t.id)
      return calculateStandings(tournament.matches, teamIds)
    }
    if (tournament.settings.format === 'group-playoff') {
      const teamIds = tournament.teams.map(t => t.id)
      return calculateStandings(tournament.matches, teamIds)
    }
    return []
  })

  let groupStandingsData = $derived(() => {
    if (tournament.settings.format !== 'group-playoff' || tournament.groups.length === 0) return []
    return tournament.groups.map(group => {
      const groupMatches = tournament.matches.filter(m => m.groupId === group.id)
      return {
        group,
        standings: calculateStandings(groupMatches, group.teamIds),
      }
    })
  })

  let hasStandings = $derived(
    tournament.settings.format === 'round-robin' || tournament.settings.format === 'group-playoff'
  )

  let hasBracket = $derived(
    tournament.settings.format === 'single-elim' ||
    tournament.settings.format === 'double-elim' ||
    (tournament.settings.format === 'group-playoff' && tournament.bracket)
  )

  function handleExport() {
    exportTournament($state.snapshot(tournament))
  }

  function handlePrint() {
    window.print()
  }

  function handleNewTournament() {
    goHome()
  }

  function roundName(ri, total) {
    if (ri === total - 1) return 'Final'
    if (ri === total - 2) return 'Semifinals'
    if (ri === total - 3) return 'Quarterfinals'
    return `Round ${ri + 1}`
  }
</script>

<!-- Celebration Overlay -->
{#if showCelebration}
  <div class="fixed inset-0 z-50 pointer-events-none overflow-hidden">
    {#each { length: 20 } as _, i}
      <span
        class="celebration-particle absolute text-2xl md:text-4xl"
        style="left: {Math.random() * 100}%; animation-delay: {Math.random() * 1.5}s; animation-duration: {2 + Math.random() * 2}s;"
      >
        {['🌽', '🧻', '🏆'][i % 3]}
      </span>
    {/each}
  </div>
{/if}

<div class="flex-1 flex flex-col items-center px-4 py-8 max-w-4xl mx-auto w-full">

  <!-- Champion Display -->
  <div class="text-center mb-10">
    <h1 class="text-3xl md:text-5xl text-cornholio-gold mb-4 leading-tight">
      🏆 THE GREAT CORNHOLIO CHAMPION! 🏆
    </h1>
    <div class="text-5xl md:text-8xl text-cornholio-gold font-heading mb-4 drop-shadow-lg"
      style="text-shadow: 0 0 40px rgba(245, 197, 66, 0.4), 0 0 80px rgba(245, 197, 66, 0.2);">
      {championName}
    </div>
    <p class="text-tp-cream/70 text-lg md:text-xl italic max-w-lg mx-auto">
      "I am the greatest! I am Cornholio!"
    </p>
  </div>

  <!-- Final Standings (round-robin / group-playoff) -->
  {#if hasStandings}
    {#if tournament.settings.format === 'group-playoff'}
      <div class="w-full mb-8">
        <h2 class="text-2xl text-cornholio-gold mb-4">Group Standings</h2>
        {#each groupStandingsData() as { group, standings: groupRows }}
          <div class="mb-6">
            <h3 class="text-lg text-cornholio-gold/80 mb-2">{group.name}</h3>
            {@render standingsTable(groupRows)}
          </div>
        {/each}
      </div>
    {:else}
      <div class="w-full mb-8">
        <h2 class="text-2xl text-cornholio-gold mb-4">Final Standings</h2>
        {@render standingsTable(standings())}
      </div>
    {/if}
  {/if}

  <!-- Final Bracket (elimination formats) -->
  {#if hasBracket && tournament.bracket}
    <div class="w-full mb-8">
      <h2 class="text-2xl text-cornholio-gold mb-4">
        {tournament.settings.format === 'group-playoff' ? 'Playoff Bracket' : 'Final Bracket'}
      </h2>
      {@render completedBracket(tournament.bracket)}
    </div>
  {/if}

  <!-- Action Buttons -->
  <div class="flex flex-wrap gap-4 justify-center no-print">
    <button
      onclick={handleExport}
      class="bg-cornholio-navy border-2 border-cornholio-gold text-cornholio-gold font-heading
        text-lg px-6 py-3 rounded-lg hover:bg-cornholio-gold hover:text-cornholio-dark
        transition-all cursor-pointer"
    >
      EXPORT RESULTS (JSON)
    </button>
    <button
      onclick={handlePrint}
      class="bg-cornholio-navy border-2 border-tp-cream/50 text-tp-cream font-heading
        text-lg px-6 py-3 rounded-lg hover:bg-tp-cream/10
        transition-all cursor-pointer"
    >
      PRINT RESULTS
    </button>
    <button
      onclick={handleNewTournament}
      class="bg-cornholio-gold text-cornholio-dark font-heading text-lg px-6 py-3 rounded-lg
        hover:bg-cornholio-gold-light hover:scale-105 transition-all cursor-pointer shadow-lg"
    >
      NEW TOURNAMENT
    </button>
  </div>
</div>

<!-- Standings table snippet -->
{#snippet standingsTable(rows)}
  {@const isQuickMode = tournament.settings.gameMode === 'quick'}
  <div class="overflow-x-auto overflow-y-hidden">
    <table class="w-full border-collapse">
      <thead>
        <tr class="bg-cornholio-gray/50 text-tp-cream/80 text-sm">
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
          <tr class="border-b border-cornholio-gray-light/20 {i === 0 ? 'bg-cornholio-gold/10' : ''}">
            <td class="px-3 py-2 text-tp-cream/50 border border-cornholio-gray-light/30">{i + 1}</td>
            <td class="px-3 py-2 border border-cornholio-gray-light/30
              {i === 0 ? 'text-cornholio-gold font-bold' : 'text-tp-white'}">
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

<!-- Completed bracket display snippet -->
{#snippet completedBracket(bracket)}
  <div class="space-y-6">
    {#if bracket.winners}
      {#if tournament.settings.format === 'double-elim'}
        <h3 class="text-lg text-cornholio-gold/80">Winners Bracket</h3>
      {/if}
      {@render completedBracketRounds(bracket.winners)}
    {:else if bracket.rounds}
      {@render completedBracketRounds(bracket.rounds)}
    {/if}
    {#if bracket.losers && bracket.losers.length > 0}
      <h3 class="text-lg text-cornholio-gold/80 mt-4">Losers Bracket</h3>
      {@render completedBracketRounds(bracket.losers)}
    {/if}
    {#if bracket.finals}
      <h3 class="text-lg text-cornholio-gold/80 mt-4">Grand Finals</h3>
      {@render completedBracketRounds([bracket.finals])}
    {/if}
  </div>
{/snippet}

{#snippet completedBracketRounds(rounds)}
  <div class="bracket-scroll flex gap-4">
    {#each rounds as round, ri}
      <div class="flex flex-col gap-3 flex-1 min-w-[180px]">
        <h4 class="text-xs text-cornholio-gold/60 font-heading">
          {round.name || roundName(ri, rounds.length)}
        </h4>
        {#each round.matches as match}
          <div class="bg-cornholio-navy/50 border border-cornholio-gray-light/30 rounded-lg p-2.5">
            {#if match.team1Id && match.team2Id && match.completed}
              <div class="flex justify-between items-center mb-1 text-sm
                {match.score1 > match.score2 ? 'text-cornholio-gold font-bold' : 'text-tp-cream/60'}">
                <span class="truncate mr-2">{teamName(match.team1Id)}</span>
                <span class="tabular-nums">{match.score1}</span>
              </div>
              <div class="flex justify-between items-center text-sm
                {match.score2 > match.score1 ? 'text-cornholio-gold font-bold' : 'text-tp-cream/60'}">
                <span class="truncate mr-2">{teamName(match.team2Id)}</span>
                <span class="tabular-nums">{match.score2}</span>
              </div>
            {:else}
              <div class="text-tp-cream/30 text-xs italic py-1">--</div>
            {/if}
          </div>
        {/each}
      </div>
    {/each}
  </div>
{/snippet}

<style>
  .bracket-scroll {
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
  }
  .bracket-scroll:hover {
    scrollbar-width: thin;
  }

  .celebration-particle {
    animation: float-up linear forwards;
    opacity: 0;
  }

  @keyframes float-up {
    0% {
      transform: translateY(100vh) rotate(0deg);
      opacity: 1;
    }
    70% {
      opacity: 1;
    }
    100% {
      transform: translateY(-20vh) rotate(360deg);
      opacity: 0;
    }
  }

  @media print {
    :global(.no-print) {
      display: none !important;
    }
  }
</style>
