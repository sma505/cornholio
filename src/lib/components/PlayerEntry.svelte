<script>
  import { getState, addPlayer, removePlayer, setStep } from '../stores/tournament.svelte.js'

  const tournament = getState()
  let newName = $state('')

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

  function next() {
    if (tournament.players.length >= 3) {
      setStep('teams')
    }
  }

  function back() {
    setStep('setup')
  }

  const minPlayers = 3
</script>

<div class="flex-1 flex flex-col items-center px-4 py-8 max-w-2xl mx-auto w-full">
  <h1 class="text-4xl md:text-5xl text-cornholio-gold mb-2">ADD PLAYERS</h1>
  <p class="text-tp-cream/60 mb-8">
    {tournament.players.length} player{tournament.players.length !== 1 ? 's' : ''} added
    {#if tournament.players.length < minPlayers}
      <span class="text-cornholio-red"> (need at least {minPlayers})</span>
    {/if}
  </p>

  <div class="flex gap-2 w-full mb-6">
    <input
      type="text"
      bind:value={newName}
      onkeydown={handleKeydown}
      placeholder="Enter player name..."
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
      ADD
    </button>
  </div>

  <div class="w-full space-y-2 mb-8 max-h-96 overflow-y-auto">
    {#each tournament.players as player, i}
      <div class="flex items-center justify-between bg-cornholio-navy/50 border border-cornholio-gray-light/50
        rounded-lg px-4 py-3 group">
        <span class="text-tp-white">
          <span class="text-cornholio-gold/50 text-sm mr-2">{i + 1}.</span>
          {player}
        </span>
        <button
          onclick={() => removePlayer(i)}
          class="text-cornholio-red/50 hover:text-cornholio-red text-xl cursor-pointer
            bg-transparent border-none opacity-0 group-hover:opacity-100 transition-opacity"
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
      ← BACK
    </button>
    <button
      onclick={next}
      disabled={tournament.players.length < minPlayers}
      class="bg-cornholio-gold text-cornholio-dark font-heading text-xl px-8 py-3 rounded-lg
        hover:bg-cornholio-gold-light hover:scale-105 transition-all cursor-pointer shadow-lg
        disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
    >
      NEXT →
    </button>
  </div>
</div>
