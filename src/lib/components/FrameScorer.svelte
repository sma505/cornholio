<script>
  import { calculateFrameResult, calculateRunningTotal, isGameComplete, validateFrame } from '../utils/scoring.js'

  let { team1Name, team2Name, settings, onGameComplete } = $props()

  let frames = $state([])
  let team1Pts = $state(0)
  let team2Pts = $state(0)
  let frameError = $state(null)
  let gameFinished = $state(false)

  let totals = $derived(calculateRunningTotal(frames))
  let preview = $derived(calculateFrameResult({ team1Pts, team2Pts }))

  function submitFrame() {
    const frame = { team1Pts: parseInt(team1Pts) || 0, team2Pts: parseInt(team2Pts) || 0 }
    const { valid, errors } = validateFrame(frame)
    if (!valid) {
      frameError = errors.join(', ')
      return
    }
    frameError = null

    frames.push(frame)
    team1Pts = 0
    team2Pts = 0

    if (isGameComplete(frames, settings)) {
      gameFinished = true
      const final = calculateRunningTotal(frames)
      onGameComplete?.(final.score1, final.score2, [...frames])
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Enter') submitFrame()
  }
</script>

<div class="space-y-3">
  <!-- Running Totals -->
  <div class="flex items-center justify-center gap-6 bg-cornholio-dark/50 rounded-lg py-3 px-4">
    <div class="text-center">
      <div class="text-tp-cream/70 text-xs truncate max-w-24">{team1Name}</div>
      <div class="text-3xl font-bold text-cornholio-gold tabular-nums">{totals.score1}</div>
    </div>
    <div class="text-tp-cream/30 text-lg">:</div>
    <div class="text-center">
      <div class="text-tp-cream/70 text-xs truncate max-w-24">{team2Name}</div>
      <div class="text-3xl font-bold text-cornholio-gold tabular-nums">{totals.score2}</div>
    </div>
  </div>

  {#if !gameFinished}
    <!-- Frame Entry -->
    <div class="bg-cornholio-navy/50 border border-cornholio-gray-light/30 rounded-lg p-3">
      <div class="flex items-center justify-center gap-3">
        <span class="text-cornholio-gold text-xs font-heading">F{frames.length + 1}</span>
        <input
          type="number"
          min="0"
          max="12"
          bind:value={team1Pts}
          onkeydown={handleKeydown}
          class="w-14 bg-cornholio-dark border border-cornholio-gold/50 rounded px-2 py-1.5
            text-cornholio-gold text-center text-lg font-bold"
        />
        <span class="text-tp-cream/40">:</span>
        <input
          type="number"
          min="0"
          max="12"
          bind:value={team2Pts}
          onkeydown={handleKeydown}
          class="w-14 bg-cornholio-dark border border-cornholio-gold/50 rounded px-2 py-1.5
            text-cornholio-gold text-center text-lg font-bold"
        />
        <button
          onclick={submitFrame}
          class="bg-cornholio-gold text-cornholio-dark font-heading px-4 py-1.5 rounded
            hover:bg-cornholio-gold-light transition-colors cursor-pointer text-sm"
        >
          OK
        </button>
      </div>

      <!-- Preview -->
      <div class="text-center mt-2">
        {#if preview.net > 0}
          <span class="text-cornholio-gold text-xs font-bold">
            {preview.scoringTeam === 1 ? team1Name : team2Name} +{preview.net}
          </span>
        {:else}
          <span class="text-tp-cream/30 text-xs">Wash</span>
        {/if}
      </div>

      {#if frameError}
        <div class="text-cornholio-red text-xs mt-1 text-center">{frameError}</div>
      {/if}
    </div>
  {:else}
    <div class="text-center py-2">
      <span class="text-cornholio-gold font-heading">GAME COMPLETE!</span>
      <span class="text-tp-cream/60 text-sm ml-2">{totals.score1} - {totals.score2}</span>
    </div>
  {/if}

  <!-- Frame Log -->
  {#if frames.length > 0}
    <div class="bg-cornholio-dark/30 rounded-lg px-3 py-2">
      <div class="flex flex-wrap gap-x-3 gap-y-1 text-xs">
        {#each frames as frame, i}
          {@const result = calculateFrameResult(frame)}
          {@const running = calculateRunningTotal(frames.slice(0, i + 1))}
          <span class="text-tp-cream/50">
            <span class="text-tp-cream/30">F{i + 1}</span>
            {frame.team1Pts}:{frame.team2Pts}
            {#if result.net > 0}
              <span class="text-cornholio-gold">
                {result.scoringTeam === 1 ? '←' : '→'}{result.net}
              </span>
            {:else}
              <span class="text-tp-cream/20">=</span>
            {/if}
            <span class="text-tp-white">[{running.score1}-{running.score2}]</span>
          </span>
        {/each}
      </div>
    </div>
  {/if}
</div>
