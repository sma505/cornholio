<script>
  import Sortable from 'sortablejs'
  import { getState, setTeams, setStep } from '../stores/tournament.svelte.js'

  const tournament = getState()

  let teams = $state([])
  let unassigned = $state([...tournament.players])
  let mode = $state('manual')

  // DOM refs for SortableJS
  let unassignedEl = $state(null)
  let teamEls = $state({})
  let sortableInstances = []

  const allAssigned = $derived(unassigned.length === 0)
  const enoughTeams = $derived(teams.length >= 2)
  const canProceed = $derived(allAssigned && enoughTeams)

  function generateTeamName(players) {
    if (players.length === 0) return 'Empty Team'
    if (players.length === 1) return players[0]
    return players[0] + ' & ' + players[1]
  }

  function shuffle() {
    const shuffled = [...tournament.players]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    const newTeams = []
    for (let i = 0; i < shuffled.length; i += 2) {
      const pair = shuffled.slice(i, i + 2)
      newTeams.push({
        id: crypto.randomUUID(),
        name: generateTeamName(pair),
        players: pair,
      })
    }

    teams = newTeams
    unassigned = []
  }

  function addTeam() {
    teams = [...teams, {
      id: crypto.randomUUID(),
      name: 'New Team',
      players: [],
    }]
  }

  function removeTeam(teamId) {
    const team = teams.find(t => t.id === teamId)
    if (team) {
      unassigned = [...unassigned, ...team.players]
      teams = teams.filter(t => t.id !== teamId)
    }
  }

  function assignPlayer(player, teamId) {
    const team = teams.find(t => t.id === teamId)
    if (!team || team.players.length >= 2) return

    unassigned = unassigned.filter(p => p !== player)
    team.players = [...team.players, player]
    team.name = generateTeamName(team.players)
    teams = [...teams]
  }

  function unassignPlayer(player, teamId) {
    const team = teams.find(t => t.id === teamId)
    if (!team) return

    team.players = team.players.filter(p => p !== player)
    team.name = generateTeamName(team.players)
    teams = [...teams]
    unassigned = [...unassigned, player]
  }

  function updateTeamName(teamId, name) {
    const team = teams.find(t => t.id === teamId)
    if (team) {
      team.name = name
      teams = [...teams]
    }
  }

  function destroySortables() {
    sortableInstances.forEach(s => s.destroy())
    sortableInstances = []
  }

  function handleSortableEnd(evt) {
    // Revert the DOM manipulation SortableJS did - we manage DOM through Svelte state
    const item = evt.item
    if (evt.from !== evt.to) {
      evt.from.insertBefore(item, evt.from.children[evt.oldIndex] || null)
    } else if (evt.oldIndex !== evt.newIndex) {
      const ref = evt.from.children[evt.oldIndex] || null
      evt.from.insertBefore(item, ref)
    }

    const playerName = evt.item.dataset.player
    const fromId = evt.from.dataset.listId
    const toId = evt.to.dataset.listId

    if (fromId === toId) return

    if (fromId === 'unassigned') {
      // Moving from unassigned to a team
      const targetTeam = teams.find(t => t.id === toId)
      if (!targetTeam || targetTeam.players.length >= 2) return
      assignPlayer(playerName, toId)
    } else if (toId === 'unassigned') {
      // Moving from a team back to unassigned
      unassignPlayer(playerName, fromId)
    } else {
      // Moving between teams
      const targetTeam = teams.find(t => t.id === toId)
      if (!targetTeam || targetTeam.players.length >= 2) return

      const sourceTeam = teams.find(t => t.id === fromId)
      if (!sourceTeam) return

      sourceTeam.players = sourceTeam.players.filter(p => p !== playerName)
      sourceTeam.name = generateTeamName(sourceTeam.players)
      targetTeam.players = [...targetTeam.players, playerName]
      targetTeam.name = generateTeamName(targetTeam.players)
      teams = [...teams]
    }
  }

  $effect(() => {
    // Track dependencies
    const _teams = teams
    const _unassigned = unassigned

    // Clean up previous instances
    destroySortables()

    // Use tick to wait for DOM updates
    const timer = setTimeout(() => {
      if (unassignedEl) {
        sortableInstances.push(
          Sortable.create(unassignedEl, {
            group: 'players',
            animation: 150,
            ghostClass: 'opacity-30',
            onEnd: handleSortableEnd,
          })
        )
      }

      for (const [id, el] of Object.entries(teamEls)) {
        if (el) {
          sortableInstances.push(
            Sortable.create(el, {
              group: 'players',
              animation: 150,
              ghostClass: 'opacity-30',
              onEnd: handleSortableEnd,
            })
          )
        }
      }
    }, 0)

    return () => {
      clearTimeout(timer)
      destroySortables()
    }
  })

  function back() {
    setStep('players')
  }

  function proceed() {
    if (!canProceed) return
    setTeams(teams.map(t => ({ id: t.id, name: t.name, players: [...t.players] })))
    setStep('play')
  }
</script>

<div class="flex-1 flex flex-col items-center px-4 py-8 max-w-5xl mx-auto w-full">
  <h1 class="text-4xl md:text-5xl text-cornholio-gold font-heading mb-2">TEAM PAIRING</h1>
  <p class="text-tp-cream/60 mb-6">
    Pair up your {tournament.players.length} players into teams of 2.
  </p>

  <!-- Mode toggle & shuffle -->
  <div class="flex flex-wrap gap-3 mb-8 justify-center">
    <button
      onclick={shuffle}
      class="bg-cornholio-gold text-cornholio-dark font-heading text-lg px-6 py-2 rounded-lg
        hover:bg-cornholio-gold-light hover:scale-105 transition-all cursor-pointer shadow-lg"
    >
      SHUFFLE TEAMS
    </button>
    <button
      onclick={addTeam}
      class="bg-cornholio-navy text-cornholio-gold font-heading text-lg px-6 py-2 rounded-lg
        border-2 border-cornholio-gold/50 hover:border-cornholio-gold transition-all cursor-pointer"
    >
      + ADD TEAM
    </button>
  </div>

  <!-- Main area: Unassigned + Teams -->
  <div class="flex flex-col md:flex-row gap-6 w-full mb-8">

    <!-- Unassigned players -->
    <div class="md:w-1/3 w-full">
      <h2 class="text-xl text-cornholio-gold font-heading mb-3">
        UNASSIGNED
        <span class="text-tp-cream/40 text-base">({unassigned.length})</span>
      </h2>
      <div
        bind:this={unassignedEl}
        data-list-id="unassigned"
        class="min-h-[120px] bg-cornholio-dark/50 border-2 border-dashed border-cornholio-gray-light/50
          rounded-xl p-3 space-y-2"
      >
        {#each unassigned as player (player)}
          <div
            data-player={player}
            class="flex items-center justify-between bg-cornholio-navy/80 border border-cornholio-gray-light/50
              rounded-lg px-4 py-2 cursor-grab active:cursor-grabbing"
          >
            <span class="text-tp-white text-sm">{player}</span>
            {#if teams.length > 0}
              <div class="flex gap-1 flex-shrink-0 ml-2">
                {#each teams as team (team.id)}
                  {#if team.players.length < 2}
                    <button
                      onclick={() => assignPlayer(player, team.id)}
                      title="Add to {team.name}"
                      class="text-xs bg-cornholio-gold/20 text-cornholio-gold px-2 py-0.5 rounded
                        hover:bg-cornholio-gold/40 transition-colors cursor-pointer border-none"
                    >
                      &rarr;T{teams.indexOf(team) + 1}
                    </button>
                  {/if}
                {/each}
              </div>
            {/if}
          </div>
        {/each}
        {#if unassigned.length === 0}
          <p class="text-tp-cream/30 text-sm text-center py-4">All players assigned!</p>
        {/if}
      </div>
    </div>

    <!-- Teams -->
    <div class="md:w-2/3 w-full">
      <h2 class="text-xl text-cornholio-gold font-heading mb-3">
        TEAMS
        <span class="text-tp-cream/40 text-base">({teams.length})</span>
      </h2>

      {#if teams.length === 0}
        <div class="min-h-[120px] bg-cornholio-dark/50 border-2 border-dashed border-cornholio-gray-light/50
          rounded-xl p-6 flex items-center justify-center">
          <p class="text-tp-cream/30 text-center">
            Click "Shuffle Teams" to auto-pair, or "Add Team" to build manually.
          </p>
        </div>
      {:else}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {#each teams as team, i (team.id)}
            <div class="bg-cornholio-navy/50 border border-cornholio-gray-light rounded-xl p-4">
              <!-- Team header -->
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2 flex-1 min-w-0">
                  <span class="text-cornholio-gold/50 font-heading text-sm flex-shrink-0">T{i + 1}</span>
                  <input
                    type="text"
                    value={team.name}
                    oninput={(e) => updateTeamName(team.id, e.target.value)}
                    class="flex-1 bg-transparent border-b border-cornholio-gold/30 text-tp-white
                      text-sm px-1 py-0.5 focus:border-cornholio-gold focus:outline-none
                      transition-colors min-w-0"
                  />
                </div>
                <button
                  onclick={() => removeTeam(team.id)}
                  title="Remove team"
                  class="text-cornholio-red/50 hover:text-cornholio-red text-lg cursor-pointer
                    bg-transparent border-none ml-2 flex-shrink-0"
                >
                  ✕
                </button>
              </div>

              <!-- Player slots (droppable) -->
              <div
                bind:this={teamEls[team.id]}
                data-list-id={team.id}
                class="min-h-[60px] bg-cornholio-dark/30 border border-dashed border-cornholio-gray-light/30
                  rounded-lg p-2 space-y-2"
              >
                {#each team.players as player (player)}
                  <div
                    data-player={player}
                    class="flex items-center justify-between bg-cornholio-gray/60 border border-cornholio-gray-light/30
                      rounded-lg px-3 py-2 cursor-grab active:cursor-grabbing"
                  >
                    <span class="text-tp-white text-sm">{player}</span>
                    <button
                      onclick={() => unassignPlayer(player, team.id)}
                      title="Remove from team"
                      class="text-cornholio-red/40 hover:text-cornholio-red text-sm cursor-pointer
                        bg-transparent border-none"
                    >
                      ✕
                    </button>
                  </div>
                {/each}
                {#if team.players.length === 0}
                  <p class="text-tp-cream/20 text-xs text-center py-2">Drag players here</p>
                {:else if team.players.length === 1}
                  <p class="text-tp-cream/20 text-xs text-center py-1">1 more slot</p>
                {/if}
              </div>

              <!-- Team capacity indicator -->
              <div class="mt-2 flex gap-1">
                {#each [0, 1] as slot}
                  <div
                    class="h-1 flex-1 rounded-full transition-colors
                      {slot < team.players.length ? 'bg-cornholio-gold' : 'bg-cornholio-gray-light/30'}"
                  ></div>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Validation messages -->
  {#if teams.length > 0}
    <div class="mb-6 text-center">
      {#if !allAssigned}
        <p class="text-cornholio-red text-sm">
          {unassigned.length} player{unassigned.length !== 1 ? 's' : ''} still unassigned.
        </p>
      {/if}
      {#if !enoughTeams}
        <p class="text-cornholio-red text-sm">Need at least 2 teams to start.</p>
      {/if}
    </div>
  {/if}

  <!-- Navigation -->
  <div class="flex gap-4">
    <button
      onclick={back}
      class="bg-cornholio-gray text-tp-cream font-heading text-xl px-8 py-3 rounded-lg
        hover:bg-cornholio-gray-light transition-all cursor-pointer border border-cornholio-gray-light"
    >
      &larr; BACK
    </button>
    <button
      onclick={proceed}
      disabled={!canProceed}
      class="bg-cornholio-gold text-cornholio-dark font-heading text-xl px-8 py-3 rounded-lg
        hover:bg-cornholio-gold-light hover:scale-105 transition-all cursor-pointer shadow-lg
        disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
    >
      START TOURNAMENT &rarr;
    </button>
  </div>
</div>
