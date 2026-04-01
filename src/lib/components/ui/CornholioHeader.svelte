<script>
  import { getRandomQuote, goHome, getState } from '../../stores/tournament.svelte.js'
  import { t, getLocale, setLocale } from '../../i18n/index.svelte.js'
  import HelpModal from './HelpModal.svelte'

  let { currentStep } = $props()

  const tournament = getState()

  const steps = $derived([
    { id: 'setup', label: t('header.setup') },
    { id: 'players', label: t('header.players') },
    { id: 'teams', label: t('header.teams') },
    { id: 'play', label: t('header.play') },
    { id: 'results', label: t('header.results') },
  ])

  const formatLabels = $derived({
    'round-robin': t('format.roundRobin'),
    'group-playoff': t('format.groupPlayoff'),
    'single-elim': t('format.singleElimShort'),
    'double-elim': t('format.doubleElimShort'),
  })

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
      title={t('header.backToTournaments')}
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
        <span>{tournament.settings.gameMode === 'quick' ? t('mode.quick') : t('mode.standard')}</span>
      </div>
      <div class="flex gap-0.5">
        <button
          onclick={() => setLocale('en')}
          class="text-[10px] px-1.5 py-0.5 rounded transition-colors cursor-pointer border
            {getLocale() === 'en'
              ? 'bg-cornholio-gold/20 text-cornholio-gold border-cornholio-gold/40'
              : 'bg-transparent text-tp-cream/30 border-cornholio-gray-light/20 hover:text-tp-cream/50'}"
        >EN</button>
        <button
          onclick={() => setLocale('de')}
          class="text-[10px] px-1.5 py-0.5 rounded transition-colors cursor-pointer border
            {getLocale() === 'de'
              ? 'bg-cornholio-gold/20 text-cornholio-gold border-cornholio-gold/40'
              : 'bg-transparent text-tp-cream/30 border-cornholio-gray-light/20 hover:text-tp-cream/50'}"
        >DE</button>
      </div>
      <button
        onclick={() => helpOpen = true}
        class="text-cornholio-gold/70 hover:text-cornholio-gold bg-transparent border border-cornholio-gold/30
          hover:border-cornholio-gold/60 rounded-full w-7 h-7 flex items-center justify-center
          cursor-pointer transition-colors text-sm font-bold"
        title={t('header.helpTitle')}
        aria-label={t('header.helpTitle')}
      >?</button>
    </div>
  </div>
</header>

<HelpModal bind:open={helpOpen} />
