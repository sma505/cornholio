<script>
  import { getRandomQuote, goHome, getState } from '../../stores/tournament.svelte.js'
  import HelpModal from './HelpModal.svelte'

  let { currentStep } = $props()

  const tournament = getState()

  const steps = [
    { id: 'setup', label: 'Setup' },
    { id: 'players', label: 'Players' },
    { id: 'teams', label: 'Teams' },
    { id: 'play', label: 'Play' },
    { id: 'results', label: 'Results' },
  ]

  const formatLabels = {
    'round-robin': 'Round Robin',
    'group-playoff': 'Group + Playoff',
    'single-elim': 'Single Elim',
    'double-elim': 'Double Elim',
  }

  let quote = $state(getRandomQuote())
  let helpOpen = $state(false)
  $effect(() => {
    const interval = setInterval(() => {
      quote = getRandomQuote()
    }, 5000)
    return () => clearInterval(interval)
  })
</script>

<header class="bg-cornholio-blue border-b-2 border-cornholio-gold/30 px-4 py-3 no-print">
  <div class="max-w-5xl mx-auto flex items-center justify-between gap-4">
    <button
      onclick={goHome}
      class="text-2xl md:text-3xl text-cornholio-gold font-heading m-0 bg-transparent border-none
        cursor-pointer hover:text-cornholio-gold-light transition-colors"
      title="Back to tournaments"
    >
      CORNHOLIO
    </button>

    <nav class="hidden md:flex gap-1">
      {#each steps as step}
        <span
          class="px-3 py-1 rounded text-sm font-medium transition-colors
            {currentStep === step.id
              ? 'bg-cornholio-gold text-cornholio-dark'
              : 'text-tp-cream/50'}"
        >
          {step.label}
        </span>
      {/each}
    </nav>

    <div class="flex items-center gap-3">
      <div class="hidden sm:flex items-center gap-1.5 text-[11px] text-tp-cream/40">
        <span>{formatLabels[tournament.settings.format] || ''}</span>
        <span class="text-tp-cream/20">/</span>
        <span class="capitalize">{tournament.settings.gameMode}</span>
      </div>
      <button
        onclick={() => helpOpen = true}
        class="text-cornholio-gold/70 hover:text-cornholio-gold bg-transparent border border-cornholio-gold/30
          hover:border-cornholio-gold/60 rounded-full w-7 h-7 flex items-center justify-center
          cursor-pointer transition-colors text-sm font-bold"
        title="Help"
        aria-label="Help"
      >?</button>
    </div>
  </div>
</header>

<HelpModal bind:open={helpOpen} />
