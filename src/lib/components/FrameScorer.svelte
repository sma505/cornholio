<script>
  import { calculateFrameResult, calculateRunningTotal, calculateRawTotal, isGameComplete, validateFrame } from '../utils/scoring.js'

  let { team1Name, team2Name, settings, onGameComplete } = $props()

  const isQuick = $derived(settings.gameMode === 'quick')
  const totalFrames = $derived(settings.numFrames || 7)

  let frames = $state([])
  let input1 = $state('')
  let input2 = $state('')
  let frameError = $state(null)
  let gameFinished = $state(false)

  let totals = $derived(calculateRunningTotal(frames))

  let previewPts1 = $derived(parseInt(input1) || 0)
  let previewPts2 = $derived(parseInt(input2) || 0)
  let preview = $derived(calculateFrameResult({ team1Pts: previewPts1, team2Pts: previewPts2 }))

  function submitFrame() {
    const team1Pts = parseInt(input1) || 0
    const team2Pts = parseInt(input2) || 0
    const frame = { team1Pts, team2Pts }
    const { valid, errors } = validateFrame(frame)
    if (!valid) {
      frameError = errors.join('. ')
      return
    }
    frameError = null

    frames.push(frame)
    input1 = ''
    input2 = ''

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
  <!-- Score Display -->
  <div class="bg-cornholio-dark/50 rounded-lg py-3 px-4">
    <div class="text-center text-tp-cream/40 text-[10px] uppercase tracking-widest mb-1">Score</div>
    <div class="flex items-center justify-center gap-4">
      <div class="text-center min-w-0">
        <div class="text-tp-cream text-xs mb-0.5 truncate">{team1Name}</div>
        <div class="text-4xl font-bold tabular-nums text-cornholio-gold">{totals.score1}</div>
      </div>
      <div class="text-tp-cream/20 text-2xl font-light">–</div>
      <div class="text-center min-w-0">
        <div class="text-tp-cream text-xs mb-0.5 truncate">{team2Name}</div>
        <div class="text-4xl font-bold tabular-nums text-cornholio-gold">{totals.score2}</div>
      </div>
    </div>
    <div class="text-center text-tp-cream/30 text-[10px] mt-1">
      {#if isQuick}
        {#if frames.length < totalFrames}
          Frame {frames.length} of {totalFrames}
        {:else}
          {totalFrames} frames played{totals.score1 === totals.score2 && settings.isBracket ? ' — sudden death!' : ''}
        {/if}
        {#if frames.length > 0}
          {@const raw = calculateRawTotal(frames)}
          <span class="text-tp-cream/20 ml-2">(raw: {raw.raw1} – {raw.raw2})</span>
        {/if}
      {:else}
        First to {settings.pointsToWin || 21}
      {/if}
    </div>
  </div>

  {#if isQuick && frames.length > 0}
    <!-- Progress bar for quick mode -->
    <div class="h-1.5 bg-cornholio-dark/50 rounded-full overflow-hidden">
      <div
        class="h-full bg-cornholio-gold transition-all duration-300 rounded-full"
        style="width: {Math.min(100, (frames.length / totalFrames) * 100)}%"
      ></div>
    </div>
  {/if}

  {#if !gameFinished}
    <!-- Frame Entry -->
    <div class="bg-cornholio-navy/50 border border-cornholio-gray-light/30 rounded-lg p-4">
      <div class="text-center text-tp-cream/50 text-xs mb-3">
        Enter each team's <span class="text-tp-cream">raw points</span> for this frame
        <span class="text-tp-cream/30">(before cancellation, e.g. 3 holes + 1 board = 10)</span>
      </div>

      <div class="flex items-center justify-center gap-2">
        <span class="text-cornholio-gold text-xs font-heading w-8 text-right">F{frames.length + 1}</span>
        <div class="text-center">
          <div class="text-tp-cream/40 text-[10px] mb-1 truncate max-w-20">{team1Name}</div>
          <input
            type="number"
            min="0"
            max="12"
            placeholder="0"
            bind:value={input1}
            onkeydown={handleKeydown}
            class="w-16 bg-cornholio-dark border-2 border-cornholio-gold/50 rounded-lg px-2 py-2
              text-cornholio-gold text-center text-xl font-bold focus:border-cornholio-gold focus:outline-none"
          />
        </div>
        <span class="text-tp-cream/30 text-lg mt-4">:</span>
        <div class="text-center">
          <div class="text-tp-cream/40 text-[10px] mb-1 truncate max-w-20">{team2Name}</div>
          <input
            type="number"
            min="0"
            max="12"
            placeholder="0"
            bind:value={input2}
            onkeydown={handleKeydown}
            class="w-16 bg-cornholio-dark border-2 border-cornholio-gold/50 rounded-lg px-2 py-2
              text-cornholio-gold text-center text-xl font-bold focus:border-cornholio-gold focus:outline-none"
          />
        </div>
        <button
          onclick={submitFrame}
          class="bg-cornholio-gold text-cornholio-dark font-heading px-4 py-2 rounded-lg mt-4
            hover:bg-cornholio-gold-light transition-colors cursor-pointer text-sm"
        >
          ADD
        </button>
      </div>

      <!-- Cancellation Preview -->
      <div class="text-center mt-2 h-5">
        {#if previewPts1 > 0 || previewPts2 > 0}
          {#if preview.net > 0}
            <span class="text-cornholio-gold text-sm font-bold">
              → {preview.scoringTeam === 1 ? team1Name : team2Name} gets +{preview.net}
            </span>
          {:else}
            <span class="text-tp-cream/40 text-sm">Equal points — no score change</span>
          {/if}
        {/if}
      </div>

      {#if frameError}
        <div class="text-cornholio-red text-xs mt-2 text-center">{frameError}</div>
      {/if}
    </div>
  {:else}
    <div class="text-center py-3 bg-cornholio-gold/10 rounded-lg">
      <span class="text-cornholio-gold font-heading text-lg">GAME COMPLETE!</span>
      <div class="text-tp-cream text-sm mt-1">{totals.score1} – {totals.score2}</div>
    </div>
  {/if}

  <!-- Frame History -->
  {#if frames.length > 0}
    <div class="bg-cornholio-dark/30 rounded-lg overflow-hidden">
      <table class="w-full text-xs">
        <thead>
          <tr class="text-tp-cream/40 border-b border-cornholio-gray-light/10">
            <th class="py-1.5 px-2 text-left w-10">Frame</th>
            <th class="py-1.5 px-2 text-center">Raw</th>
            <th class="py-1.5 px-2 text-center">Net</th>
            <th class="py-1.5 px-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {#each frames as frame, i}
            {@const result = calculateFrameResult(frame)}
            {@const running = calculateRunningTotal(frames.slice(0, i + 1))}
            <tr class="border-b border-cornholio-gray-light/5
              {i === frames.length - 1 ? 'bg-cornholio-navy/30' : ''}">
              <td class="py-1 px-2 text-tp-cream/30">F{i + 1}</td>
              <td class="py-1 px-2 text-center text-tp-cream/60">{frame.team1Pts} : {frame.team2Pts}</td>
              <td class="py-1 px-2 text-center">
                {#if result.net > 0}
                  <span class="text-cornholio-gold font-bold">
                    +{result.net} {result.scoringTeam === 1 ? team1Name : team2Name}
                  </span>
                {:else}
                  <span class="text-tp-cream/25">–</span>
                {/if}
              </td>
              <td class="py-1 px-2 text-right text-tp-white font-bold tabular-nums">{running.score1} – {running.score2}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
