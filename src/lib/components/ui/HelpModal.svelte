<script>
  let { open = $bindable(false) } = $props()
  import { t } from '../../i18n/index.svelte.js'

  let activeSection = $state('scoring')

  const sections = $derived([
    { id: 'scoring', label: t('help.tabScoring') },
    { id: 'formats', label: t('help.tabFormats') },
    { id: 'modes', label: t('help.tabModes') },
    { id: 'settings', label: t('help.tabSettings') },
  ])

  function close() {
    open = false
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') close()
  }

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) close()
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    onclick={handleBackdrop}
  >
    <div class="bg-cornholio-dark border border-cornholio-gold/40 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl">
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4 border-b border-cornholio-gold/20">
        <h2 class="text-xl font-heading text-cornholio-gold m-0">{t('help.title')}</h2>
        <button
          onclick={close}
          class="text-tp-cream/60 hover:text-cornholio-gold text-2xl leading-none bg-transparent border-none cursor-pointer p-1"
          aria-label={t('help.closeLabel')}
        >&times;</button>
      </div>

      <!-- Tab nav -->
      <div class="flex gap-1 px-5 pt-3 border-b border-cornholio-gold/10">
        {#each sections as section}
          <button
            onclick={() => activeSection = section.id}
            class="px-3 py-2 text-sm font-medium rounded-t transition-colors border-none cursor-pointer
              {activeSection === section.id
                ? 'bg-cornholio-gold/20 text-cornholio-gold border-b-2 border-cornholio-gold'
                : 'bg-transparent text-tp-cream/50 hover:text-tp-cream/80'}"
          >
            {section.label}
          </button>
        {/each}
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto px-5 py-4 text-tp-cream/90 text-sm leading-relaxed space-y-4 help-content">
        {#if activeSection === 'scoring'}
          <h3 class="text-cornholio-gold font-heading text-lg">{t('help.whatIsCornhole')}</h3>
          <p>{t('help.whatIsCornholeText')}</p>

          <h3 class="text-cornholio-gold font-heading text-lg mt-6">{t('help.howScoringWorks')}</h3>
          <p>{t('help.eachBagCanScore')}</p>
          <div class="bg-cornholio-blue/50 rounded-lg p-3 space-y-1">
            <p><strong class="text-cornholio-gold-light">{t('help.throughHole')}</strong> {t('help.points3')}</p>
            <p><strong class="text-cornholio-gold-light">{t('help.landsOnBoard')}</strong> {t('help.points1')}</p>
            <p><strong class="text-cornholio-gold-light">{t('help.missesBoard')}</strong> {t('help.points0')}</p>
            <p class="text-tp-cream/60 text-xs mt-2">{t('help.maxPerFrame')}</p>
          </div>
          <p class="mt-3">{t('help.cancellationExplained')}</p>

          <h3 class="text-cornholio-gold font-heading text-lg mt-6">{t('help.enteringScores')}</h3>
          <p>{t('help.chooseMethod')}</p>
          <div class="bg-cornholio-blue/50 rounded-lg p-3 space-y-2">
            <p><strong class="text-cornholio-gold-light">{t('help.totalEntry')}</strong> {t('help.totalEntryDesc')}</p>
            <p><strong class="text-cornholio-gold-light">{t('help.frameEntry')}</strong> {t('help.frameEntryDesc')}</p>
          </div>

          <h3 class="text-cornholio-gold font-heading text-lg mt-6">{t('help.standingsTitle')}</h3>
          <p>{t('help.standingsText')}</p>
          <div class="bg-cornholio-blue/50 rounded-lg p-3 space-y-1">
            <p><strong class="text-cornholio-gold-light">{t('help.win')}</strong> {t('help.winPts')} &nbsp;|&nbsp; <strong class="text-cornholio-gold-light">{t('help.drawLabel')}</strong> {t('help.drawPts')} &nbsp;|&nbsp; <strong class="text-cornholio-gold-light">{t('help.loss')}</strong> {t('help.lossPts')}</p>
            <p class="text-tp-cream/60 text-xs mt-1">{t('help.tiebreaker')}</p>
          </div>

        {:else if activeSection === 'formats'}
          <h3 class="text-cornholio-gold font-heading text-lg">{t('help.teamsOrSingles')}</h3>
          <div class="bg-cornholio-blue/50 rounded-lg p-3 space-y-2">
            <p><strong class="text-cornholio-gold-light">{t('setup.teams')}</strong> {t('help.teamsHelp')}</p>
            <p><strong class="text-cornholio-gold-light">{t('setup.singles')}</strong> {t('help.singlesHelp')}</p>
          </div>

          <h3 class="text-cornholio-gold font-heading text-lg mt-6">{t('help.tournamentFormats')}</h3>
          <div class="space-y-4">
            <div class="bg-cornholio-blue/50 rounded-lg p-3">
              <h4 class="text-cornholio-gold-light font-bold m-0">{t('format.roundRobin')}</h4>
              <p class="mt-1">{t('help.rrHelp')}</p>
            </div>
            <div class="bg-cornholio-blue/50 rounded-lg p-3">
              <h4 class="text-cornholio-gold-light font-bold m-0">{t('format.groupPlayoff')}</h4>
              <p class="mt-1">{t('help.gpHelp')}</p>
            </div>
            <div class="bg-cornholio-blue/50 rounded-lg p-3">
              <h4 class="text-cornholio-gold-light font-bold m-0">{t('format.singleElim')}</h4>
              <p class="mt-1">{t('help.seHelp')}</p>
            </div>
            <div class="bg-cornholio-blue/50 rounded-lg p-3">
              <h4 class="text-cornholio-gold-light font-bold m-0">{t('format.doubleElim')}</h4>
              <p class="mt-1">{t('help.deHelp')}</p>
            </div>
          </div>

        {:else if activeSection === 'modes'}
          <h3 class="text-cornholio-gold font-heading text-lg">{t('help.standardMode')}</h3>
          <p>{t('help.standardModeText')}</p>
          <div class="bg-cornholio-blue/50 rounded-lg p-3 space-y-2">
            <p><strong class="text-cornholio-gold-light">{t('setup.skunkRule')}</strong> {t('help.skunkHelp')}</p>
            <p><strong class="text-cornholio-gold-light">{t('help.bestOfTitle')}</strong> {t('help.bestOfHelp')}</p>
          </div>

          <h3 class="text-cornholio-gold font-heading text-lg mt-6">{t('help.quickMode')}</h3>
          <p>{t('help.quickModeText')}</p>
          <div class="bg-cornholio-blue/50 rounded-lg p-3 space-y-2">
            <p><strong class="text-cornholio-gold-light">{t('help.tiesPossible')}</strong> {t('help.tiesPossibleText')}</p>
            <p><strong class="text-cornholio-gold-light">{t('help.noTiesKnockout')}</strong> {t('help.noTiesKnockoutText')}</p>
          </div>
          <div class="bg-cornholio-blue/50 rounded-lg p-3 mt-4">
            <p class="text-tp-cream/60 text-xs">{t('help.framesDefault')}</p>
          </div>

        {:else if activeSection === 'settings'}
          <h3 class="text-cornholio-gold font-heading text-lg">{t('help.settingsTitle')}</h3>
          <div class="space-y-3">
            <div class="bg-cornholio-blue/50 rounded-lg p-3">
              <h4 class="text-cornholio-gold-light font-bold m-0">{t('help.courtsTitle')}</h4>
              <p class="mt-1">{t('help.courtsText')}</p>
            </div>
            <div class="bg-cornholio-blue/50 rounded-lg p-3">
              <h4 class="text-cornholio-gold-light font-bold m-0">{t('help.pointsToWinTitle')}</h4>
              <p class="mt-1">{t('help.pointsToWinText')}</p>
            </div>
            <div class="bg-cornholio-blue/50 rounded-lg p-3">
              <h4 class="text-cornholio-gold-light font-bold m-0">{t('help.skunkTitle')}</h4>
              <p class="mt-1">{t('help.skunkText')}</p>
            </div>
            <div class="bg-cornholio-blue/50 rounded-lg p-3">
              <h4 class="text-cornholio-gold-light font-bold m-0">{t('help.bestOfTitle')}</h4>
              <p class="mt-1">{t('help.bestOfText')}</p>
            </div>
            <div class="bg-cornholio-blue/50 rounded-lg p-3">
              <h4 class="text-cornholio-gold-light font-bold m-0">{t('help.framesTitle')}</h4>
              <p class="mt-1">{t('help.framesText')}</p>
            </div>
            <div class="bg-cornholio-blue/50 rounded-lg p-3">
              <h4 class="text-cornholio-gold-light font-bold m-0">{t('help.groupsTitle')}</h4>
              <p class="mt-1">{t('help.groupsText')}</p>
            </div>
            <div class="bg-cornholio-blue/50 rounded-lg p-3">
              <h4 class="text-cornholio-gold-light font-bold m-0">{t('help.scoreEntryTitle')}</h4>
              <p class="mt-1">{t('help.scoreEntryText')}</p>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .help-content :global(p) {
    margin: 0;
  }
  .help-content :global(p + p) {
    margin-top: 0.25rem;
  }
</style>
