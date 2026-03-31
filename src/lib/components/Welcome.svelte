<script>
  import { getState, setStep, loadState } from '../stores/tournament.svelte.js'
  import { loadTournament, importTournament } from '../utils/persistence.js'

  const state = getState()
  const hasSaved = !!loadTournament()

  function startNew() {
    setStep('setup')
  }

  function continueSaved() {
    const saved = loadTournament()
    if (saved && saved.step !== 'welcome') {
      loadState(saved)
    }
  }

  let fileInput

  async function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    try {
      const imported = await importTournament(file)
      loadState(imported)
    } catch (err) {
      alert('Failed to import: ' + err.message)
    }
  }
</script>

<div class="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center">
  <div class="mb-8">
    <div class="text-8xl md:text-9xl mb-4">🌽</div>
    <h1 class="text-5xl md:text-7xl text-cornholio-gold mb-2 leading-tight">
      THE GREAT<br />CORNHOLIO
    </h1>
    <h2 class="text-2xl md:text-3xl text-cornholio-gold-light font-heading tracking-wider">
      TOURNAMENT MANAGER
    </h2>
  </div>

  <p class="text-tp-cream/70 text-lg mb-8 max-w-md italic">
    "I am Cornholio! I need TP for my bunghole!"
  </p>

  <div class="flex flex-col gap-4 w-full max-w-xs">
    <button
      onclick={startNew}
      class="bg-cornholio-gold text-cornholio-dark font-heading text-2xl px-8 py-4 rounded-lg
        hover:bg-cornholio-gold-light hover:scale-105 transition-all duration-200
        rotate-[-1deg] hover:rotate-0 cursor-pointer shadow-lg"
    >
      START TOURNAMENT
    </button>

    {#if hasSaved}
      <button
        onclick={continueSaved}
        class="bg-cornholio-navy text-cornholio-gold border-2 border-cornholio-gold/50
          font-heading text-xl px-6 py-3 rounded-lg hover:border-cornholio-gold
          hover:scale-105 transition-all duration-200 cursor-pointer"
      >
        CONTINUE SAVED
      </button>
    {/if}

    <button
      onclick={() => fileInput.click()}
      class="text-tp-cream/50 hover:text-tp-cream text-sm underline cursor-pointer bg-transparent border-none"
    >
      Import tournament file
    </button>
    <input
      bind:this={fileInput}
      type="file"
      accept=".json"
      onchange={handleImport}
      class="hidden"
    />
  </div>
</div>
