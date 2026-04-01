<script>
  import { createNewTournament, loadExistingTournament, loadState, getState } from '../stores/tournament.svelte.js'
  import { getTournamentIndex, deleteTournament, importTournament, exportTournament, loadTournament } from '../utils/persistence.js'
  import HelpModal from './ui/HelpModal.svelte'
  import { t, getLocale, setLocale } from '../i18n/index.svelte.js'

  const tournament = getState()
  let helpOpen = $state(false)

  let tournaments = $state([])
  let newName = $state('')
  let fileInput
  let deleteConfirm = $state(null)

  function refresh() {
    tournaments = getTournamentIndex().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  }

  // Refresh list whenever we're on home step (tracks state.step reactively)
  $effect(() => {
    if (tournament.step === 'home') refresh()
  })

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
      alert(t('home.importFailed') + err.message)
    }
    fileInput.value = ''
  }

  function formatLabel(format) {
    const labels = {
      'round-robin': t('format.roundRobin'),
      'group-playoff': t('format.groupPlayoff'),
      'single-elim': t('format.singleElim'),
      'double-elim': t('format.doubleElim'),
    }
    return labels[format] || format
  }

  function stepLabel(step) {
    const labels = { setup: t('step.settingUp'), players: t('step.addingPlayers'), teams: t('step.pairingTeams'), play: t('step.inProgress'), results: t('step.completed') }
    return labels[step] || step
  }

  function timeAgo(dateStr) {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return t('home.justNow')
    if (mins < 60) return t('home.minsAgo', { mins })
    const hours = Math.floor(mins / 60)
    if (hours < 24) return t('home.hoursAgo', { hours })
    const days = Math.floor(hours / 24)
    return t('home.daysAgo', { days })
  }
</script>

<div class="flex-1 flex flex-col items-center px-4 py-8">
  <!-- Branding -->
  <div class="text-center mb-8">
    <div class="text-6xl mb-3">🌽</div>
    <h1 class="text-4xl md:text-5xl text-cornholio-gold font-heading leading-tight">{t('home.title')}</h1>
    <p class="text-tp-cream/50 text-sm mt-1">{t('home.subtitle')}</p>
    <button
      onclick={() => helpOpen = true}
      class="mt-3 text-cornholio-gold/60 hover:text-cornholio-gold bg-transparent border border-cornholio-gold/30
        hover:border-cornholio-gold/60 rounded-full px-4 py-1 cursor-pointer transition-colors text-sm"
    >{t('home.help')}</button>
    <div class="mt-2 flex gap-1 justify-center">
      <button
        onclick={() => setLocale('en')}
        class="text-xs px-2 py-0.5 rounded transition-colors cursor-pointer border
          {getLocale() === 'en'
            ? 'bg-cornholio-gold/20 text-cornholio-gold border-cornholio-gold/40'
            : 'bg-transparent text-tp-cream/40 border-cornholio-gray-light/30 hover:text-tp-cream/60'}"
      >EN</button>
      <button
        onclick={() => setLocale('de')}
        class="text-xs px-2 py-0.5 rounded transition-colors cursor-pointer border
          {getLocale() === 'de'
            ? 'bg-cornholio-gold/20 text-cornholio-gold border-cornholio-gold/40'
            : 'bg-transparent text-tp-cream/40 border-cornholio-gray-light/30 hover:text-tp-cream/60'}"
      >DE</button>
    </div>
  </div>

  <!-- Create New -->
  <div class="w-full max-w-lg mb-8">
    <div class="flex gap-2">
      <input
        type="text"
        bind:value={newName}
        onkeydown={handleKeydown}
        placeholder={t('home.namePlaceholder')}
        class="flex-1 bg-cornholio-dark border-2 border-cornholio-gold/50 rounded-lg px-4 py-3
          text-tp-white text-lg placeholder-tp-cream/30 focus:border-cornholio-gold focus:outline-none"
      />
      <button
        onclick={handleCreate}
        class="bg-cornholio-gold text-cornholio-dark font-heading text-xl px-6 py-3 rounded-lg
          hover:bg-cornholio-gold-light hover:scale-105 transition-all cursor-pointer shadow-lg
          whitespace-nowrap"
      >
        {t('home.new')}
      </button>
    </div>
  </div>

  <!-- Tournament List -->
  {#if tournaments.length > 0}
    <div class="w-full max-w-lg space-y-3 mb-8">
      <h2 class="text-lg text-cornholio-gold font-heading">{t('home.yourTournaments')}</h2>
      {#each tournaments as tr (tr.id)}
        <div class="bg-cornholio-navy/50 border border-cornholio-gray-light/30 rounded-xl p-4
          hover:border-cornholio-gold/30 transition-colors">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <h3 class="text-tp-white font-medium truncate">{tr.name}</h3>
              <div class="flex flex-wrap gap-2 mt-1">
                <span class="text-tp-cream/40 text-xs">{formatLabel(tr.format)}</span>
                {#if tr.gameMode === 'quick'}
                  <span class="text-cornholio-gold/50 text-xs">{t('mode.quick')}</span>
                {/if}
                <span class="text-tp-cream/30 text-xs">{stepLabel(tr.step)}</span>
                <span class="text-tp-cream/20 text-xs">{timeAgo(tr.updatedAt)}</span>
              </div>
            </div>
            <div class="flex gap-2 flex-shrink-0">
              <button
                onclick={() => handleContinue(tr.id)}
                class="bg-cornholio-gold text-cornholio-dark font-heading text-sm px-4 py-1.5 rounded-lg
                  hover:bg-cornholio-gold-light transition-colors cursor-pointer"
              >
                {tr.step === 'results' ? t('home.view') : t('home.continue')}
              </button>
              <button
                onclick={() => handleExport(tr.id)}
                title={t('home.exportJson')}
                class="text-tp-cream/40 hover:text-tp-cream text-sm cursor-pointer bg-transparent
                  border border-cornholio-gray-light/30 rounded-lg px-2 py-1.5 hover:border-tp-cream/30"
              >
                ↓
              </button>
              <button
                onclick={() => deleteConfirm = tr.id}
                title={t('home.deleteTitle')}
                class="text-cornholio-red/40 hover:text-cornholio-red text-sm cursor-pointer bg-transparent
                  border border-cornholio-gray-light/30 rounded-lg px-2 py-1.5 hover:border-cornholio-red/30"
              >
                ✕
              </button>
            </div>
          </div>

          {#if deleteConfirm === tr.id}
            <div class="mt-3 pt-3 border-t border-cornholio-gray-light/20 flex items-center justify-between">
              <span class="text-cornholio-red text-xs">{t('home.deleteConfirm', { name: tr.name })}</span>
              <div class="flex gap-2">
                <button
                  onclick={() => deleteConfirm = null}
                  class="text-tp-cream/50 text-xs cursor-pointer bg-transparent border-none"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onclick={() => handleDelete(tr.id)}
                  class="text-cornholio-red text-xs font-bold cursor-pointer bg-transparent border-none"
                >
                  {t('common.delete')}
                </button>
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <p class="text-tp-cream/30 text-sm mb-8 italic">
      "{t('home.emptyQuote')}"
    </p>
  {/if}

  <!-- Import -->
  <button
    onclick={() => fileInput.click()}
    class="text-tp-cream/40 hover:text-tp-cream text-sm underline cursor-pointer bg-transparent border-none"
  >
    {t('home.importTournament')}
  </button>
  <input
    bind:this={fileInput}
    type="file"
    accept=".json"
    onchange={handleImport}
    class="hidden"
  />
</div>

<HelpModal bind:open={helpOpen} />
