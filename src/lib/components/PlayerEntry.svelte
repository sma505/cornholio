<script>
  import { getState, addPlayer, removePlayer, renamePlayer, setStep, createTeamsFromPlayers } from '../stores/tournament.svelte.js'
  import { t } from '../i18n/index.svelte.js'

  const tournament = getState()
  let newName = $state('')
  let editingIndex = $state(-1)
  let editingName = $state('')

  const isSingles = $derived(tournament.settings.tournamentType === 'singles')
  const minPlayers = $derived(() => {
    const format = tournament.settings.format
    if (isSingles) {
      // Singles: each player becomes a team
      if (format === 'group-playoff') return Math.max(4, tournament.settings.numGroups * 2)
      return 2
    }
    // Teams: need pairs of 2, so even number; min 2 teams = 4 players
    if (format === 'group-playoff') return Math.max(4, tournament.settings.numGroups * 2) * 2
    return 4
  })

  function handleAdd() {
    const name = newName.trim()
    if (name && !tournament.players.includes(name)) {
      addPlayer(name)
      newName = ''
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Enter') handleAdd()
  }

  function startEdit(index) {
    editingIndex = index
    editingName = tournament.players[index]
  }

  function commitEdit() {
    const name = editingName.trim()
    if (name && editingIndex >= 0) {
      // Allow same name (no-op) or a name not already taken by another player
      const duplicate = tournament.players.some((p, i) => i !== editingIndex && p === name)
      if (!duplicate) {
        renamePlayer(editingIndex, name)
      }
    }
    editingIndex = -1
    editingName = ''
  }

  function cancelEdit() {
    editingIndex = -1
    editingName = ''
  }

  function handleEditKeydown(e) {
    if (e.key === 'Enter') commitEdit()
    if (e.key === 'Escape') cancelEdit()
  }

  function next() {
    if (tournament.players.length >= minPlayers()) {
      if (isSingles) {
        // Skip team pairing — auto-create 1-player teams
        createTeamsFromPlayers()
        setStep('play')
      } else {
        setStep('teams')
      }
    }
  }

  function back() {
    setStep('setup')
  }
</script>

<div class="flex-1 flex flex-col items-center px-4 py-8 max-w-2xl mx-auto w-full">
  <h1 class="text-4xl md:text-5xl text-cornholio-gold mb-2">{t('players.title')}</h1>
  <p class="text-tp-cream/60 mb-8">
    {t('players.count').split(' | ')[tournament.players.length === 1 ? 0 : 1].replace('{count}', tournament.players.length)}
    {#if tournament.players.length < minPlayers()}
      <span class="text-cornholio-red"> {t('players.needAtLeast', { min: minPlayers() })}</span>
    {/if}
  </p>

  <div class="flex gap-2 w-full mb-6">
    <input
      type="text"
      bind:value={newName}
      onkeydown={handleKeydown}
      placeholder={t('players.placeholder')}
      class="flex-1 bg-cornholio-dark border-2 border-cornholio-gold/50 rounded-lg px-4 py-3
        text-tp-white text-lg placeholder-tp-cream/30 focus:border-cornholio-gold
        focus:outline-none transition-colors"
    />
    <button
      onclick={handleAdd}
      disabled={!newName.trim()}
      class="bg-cornholio-gold text-cornholio-dark font-heading text-xl px-6 py-3 rounded-lg
        hover:bg-cornholio-gold-light transition-all cursor-pointer
        disabled:opacity-30 disabled:cursor-not-allowed"
    >
      {t('players.add')}
    </button>
  </div>

  <div class="w-full space-y-2 mb-8 max-h-96 overflow-y-auto">
    {#each tournament.players as player, i}
      <div class="flex items-center justify-between bg-cornholio-navy/50 border border-cornholio-gray-light/50
        rounded-lg px-4 py-3">
        {#if editingIndex === i}
          <div class="flex items-center flex-1 mr-2">
            <span class="text-cornholio-gold/50 text-sm mr-2">{i + 1}.</span>
            <input
              type="text"
              bind:value={editingName}
              onkeydown={handleEditKeydown}
              onblur={commitEdit}
              autofocus
              class="flex-1 bg-cornholio-dark border border-cornholio-gold rounded px-2 py-1
                text-tp-white focus:outline-none"
            />
          </div>
        {:else}
          <button
            onclick={() => startEdit(i)}
            class="text-tp-white text-left flex-1 bg-transparent border-none cursor-pointer
              hover:text-cornholio-gold transition-colors p-0"
          >
            <span class="text-cornholio-gold/50 text-sm mr-2">{i + 1}.</span>
            {player}
          </button>
        {/if}
        <button
          onclick={() => removePlayer(i)}
          class="text-cornholio-red/50 hover:text-cornholio-red text-xl cursor-pointer
            bg-transparent border-none transition-opacity ml-2"
        >
          ✕
        </button>
      </div>
    {/each}
  </div>

  <div class="flex gap-4">
    <button
      onclick={back}
      class="bg-cornholio-gray text-tp-cream font-heading text-xl px-8 py-3 rounded-lg
        hover:bg-cornholio-gray-light transition-all cursor-pointer border border-cornholio-gray-light"
    >
      {t('common.back')}
    </button>
    <button
      onclick={next}
      disabled={tournament.players.length < minPlayers()}
      class="bg-cornholio-gold text-cornholio-dark font-heading text-xl px-8 py-3 rounded-lg
        hover:bg-cornholio-gold-light hover:scale-105 transition-all cursor-pointer shadow-lg
        disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
    >
      {isSingles ? t('players.startTournament') : t('common.next')}
    </button>
  </div>
</div>
