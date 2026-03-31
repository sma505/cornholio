<script>
  import { createNewTournament, loadExistingTournament, loadState } from '../stores/tournament.svelte.js'
  import { getTournamentIndex, deleteTournament, importTournament, exportTournament, loadTournament } from '../utils/persistence.js'

  let tournaments = $state(getTournamentIndex().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)))
  let newName = $state('')
  let fileInput
  let deleteConfirm = $state(null)

  function refresh() {
    tournaments = getTournamentIndex().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  }

  function handleCreate() {
    const name = newName.trim() || 'New Tournament'
    createNewTournament(name)
    newName = ''
  }

  function handleKeydown(e) {
    if (e.key === 'Enter') handleCreate()
  }

  function handleContinue(id) {
    loadExistingTournament(id)
  }

  function handleDelete(id) {
    deleteTournament(id)
    deleteConfirm = null
    refresh()
  }

  function handleExport(id) {
    const state = loadTournament(id)
    if (state) exportTournament(state)
  }

  async function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    try {
      const imported = await importTournament(file)
      loadState(imported)
    } catch (err) {
      alert('Failed to import: ' + err.message)
    }
    fileInput.value = ''
  }

  function formatLabel(format) {
    const labels = {
      'round-robin': 'Round Robin',
      'group-playoff': 'Group + Playoff',
      'single-elim': 'Single Elimination',
      'double-elim': 'Double Elimination',
    }
    return labels[format] || format
  }

  function stepLabel(step) {
    const labels = { setup: 'Setting up', players: 'Adding players', teams: 'Pairing teams', play: 'In progress', results: 'Completed' }
    return labels[step] || step
  }

  function timeAgo(dateStr) {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }
</script>

<div class="flex-1 flex flex-col items-center px-4 py-8">
  <!-- Branding -->
  <div class="text-center mb-8">
    <div class="text-6xl mb-3">🌽</div>
    <h1 class="text-4xl md:text-5xl text-cornholio-gold font-heading leading-tight">CORNHOLIO</h1>
    <p class="text-tp-cream/50 text-sm mt-1">Tournament Manager</p>
  </div>

  <!-- Create New -->
  <div class="w-full max-w-lg mb-8">
    <div class="flex gap-2">
      <input
        type="text"
        bind:value={newName}
        onkeydown={handleKeydown}
        placeholder="Tournament name..."
        class="flex-1 bg-cornholio-dark border-2 border-cornholio-gold/50 rounded-lg px-4 py-3
          text-tp-white text-lg placeholder-tp-cream/30 focus:border-cornholio-gold focus:outline-none"
      />
      <button
        onclick={handleCreate}
        class="bg-cornholio-gold text-cornholio-dark font-heading text-xl px-6 py-3 rounded-lg
          hover:bg-cornholio-gold-light hover:scale-105 transition-all cursor-pointer shadow-lg
          whitespace-nowrap"
      >
        NEW
      </button>
    </div>
  </div>

  <!-- Tournament List -->
  {#if tournaments.length > 0}
    <div class="w-full max-w-lg space-y-3 mb-8">
      <h2 class="text-lg text-cornholio-gold font-heading">YOUR TOURNAMENTS</h2>
      {#each tournaments as t (t.id)}
        <div class="bg-cornholio-navy/50 border border-cornholio-gray-light/30 rounded-xl p-4
          hover:border-cornholio-gold/30 transition-colors">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <h3 class="text-tp-white font-medium truncate">{t.name}</h3>
              <div class="flex flex-wrap gap-2 mt-1">
                <span class="text-tp-cream/40 text-xs">{formatLabel(t.format)}</span>
                {#if t.gameMode === 'quick'}
                  <span class="text-cornholio-gold/50 text-xs">Quick</span>
                {/if}
                <span class="text-tp-cream/30 text-xs">{stepLabel(t.step)}</span>
                <span class="text-tp-cream/20 text-xs">{timeAgo(t.updatedAt)}</span>
              </div>
            </div>
            <div class="flex gap-2 flex-shrink-0">
              <button
                onclick={() => handleContinue(t.id)}
                class="bg-cornholio-gold text-cornholio-dark font-heading text-sm px-4 py-1.5 rounded-lg
                  hover:bg-cornholio-gold-light transition-colors cursor-pointer"
              >
                {t.step === 'results' ? 'VIEW' : 'CONTINUE'}
              </button>
              <button
                onclick={() => handleExport(t.id)}
                title="Export JSON"
                class="text-tp-cream/40 hover:text-tp-cream text-sm cursor-pointer bg-transparent
                  border border-cornholio-gray-light/30 rounded-lg px-2 py-1.5 hover:border-tp-cream/30"
              >
                ↓
              </button>
              <button
                onclick={() => deleteConfirm = t.id}
                title="Delete"
                class="text-cornholio-red/40 hover:text-cornholio-red text-sm cursor-pointer bg-transparent
                  border border-cornholio-gray-light/30 rounded-lg px-2 py-1.5 hover:border-cornholio-red/30"
              >
                ✕
              </button>
            </div>
          </div>

          {#if deleteConfirm === t.id}
            <div class="mt-3 pt-3 border-t border-cornholio-gray-light/20 flex items-center justify-between">
              <span class="text-cornholio-red text-xs">Delete "{t.name}"?</span>
              <div class="flex gap-2">
                <button
                  onclick={() => deleteConfirm = null}
                  class="text-tp-cream/50 text-xs cursor-pointer bg-transparent border-none"
                >
                  Cancel
                </button>
                <button
                  onclick={() => handleDelete(t.id)}
                  class="text-cornholio-red text-xs font-bold cursor-pointer bg-transparent border-none"
                >
                  Delete
                </button>
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <p class="text-tp-cream/30 text-sm mb-8 italic">
      "I am Cornholio! I need TP for my bunghole!"
    </p>
  {/if}

  <!-- Import -->
  <button
    onclick={() => fileInput.click()}
    class="text-tp-cream/40 hover:text-tp-cream text-sm underline cursor-pointer bg-transparent border-none"
  >
    Import tournament from file
  </button>
  <input
    bind:this={fileInput}
    type="file"
    accept=".json"
    onchange={handleImport}
    class="hidden"
  />
</div>
