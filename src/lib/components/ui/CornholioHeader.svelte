<script>
  import { getRandomQuote, goHome } from '../../stores/tournament.svelte.js'

  let { currentStep } = $props()

  const steps = [
    { id: 'setup', label: 'Setup' },
    { id: 'players', label: 'Players' },
    { id: 'teams', label: 'Teams' },
    { id: 'play', label: 'Play' },
    { id: 'results', label: 'Results' },
  ]

  let quote = $state(getRandomQuote())
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

    <p class="text-xs md:text-sm text-cornholio-gold-light italic hidden sm:block max-w-48 text-right h-10 overflow-hidden line-clamp-2 flex items-center justify-end">
      "{quote}"
    </p>
  </div>
</header>
