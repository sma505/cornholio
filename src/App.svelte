<script>
  import { getState } from './lib/stores/tournament.svelte.js'
  import Home from './lib/components/Home.svelte'
  import TournamentSetup from './lib/components/TournamentSetup.svelte'
  import PlayerEntry from './lib/components/PlayerEntry.svelte'
  import TeamPairing from './lib/components/TeamPairing.svelte'
  import GamePlay from './lib/components/GamePlay.svelte'
  import Results from './lib/components/Results.svelte'
  import CornholioHeader from './lib/components/ui/CornholioHeader.svelte'

  const state = getState()
</script>

<div class="flex flex-col min-h-dvh">
  {#if state.step !== 'home'}
    <CornholioHeader currentStep={state.step} />
  {/if}

  <main class="flex-1 flex flex-col">
    {#if state.step === 'home'}
      <Home />
    {:else if state.step === 'setup'}
      <TournamentSetup />
    {:else if state.step === 'players'}
      <PlayerEntry />
    {:else if state.step === 'teams'}
      <TeamPairing />
    {:else if state.step === 'play'}
      <GamePlay />
    {:else if state.step === 'results'}
      <Results />
    {/if}
  </main>
</div>
