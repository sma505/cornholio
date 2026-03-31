<script>
  import { calculateFrameResult, calculateRunningTotal, isGameComplete, validateFrame } from '../utils/scoring.js'

  let { team1Name, team2Name, settings, onGameComplete } = $props()

  let frames = $state([])
  let currentFrame = $state({ team1Holes: 0, team1Boards: 0, team2Holes: 0, team2Boards: 0 })
  let frameError = $state(null)
  let gameFinished = $state(false)

  let totals = $derived(calculateRunningTotal(frames))
  let currentResult = $derived(calculateFrameResult(currentFrame))

  function clamp(val, max) {
    return Math.max(0, Math.min(max, val))
  }

  function updateBags(team, type, value) {
    const v = clamp(parseInt(value) || 0, 4)
    if (team === 1) {
      if (type === 'holes') {
        currentFrame.team1Holes = v
        currentFrame.team1Boards = Math.min(currentFrame.team1Boards, 4 - v)
      } else {
        currentFrame.team1Boards = Math.min(v, 4 - currentFrame.team1Holes)
      }
    } else {
      if (type === 'holes') {
        currentFrame.team2Holes = v
        currentFrame.team2Boards = Math.min(currentFrame.team2Boards, 4 - v)
      } else {
        currentFrame.team2Boards = Math.min(v, 4 - currentFrame.team2Holes)
      }
    }
  }

  function submitFrame() {
    const { valid, errors } = validateFrame(currentFrame)
    if (!valid) {
      frameError = errors.join(', ')
      return
    }
    frameError = null

    frames.push({ ...currentFrame })
    currentFrame = { team1Holes: 0, team1Boards: 0, team2Holes: 0, team2Boards: 0 }

    if (isGameComplete(frames, settings)) {
      gameFinished = true
      const final = calculateRunningTotal(frames)
      onGameComplete?.(final.score1, final.score2, [...frames])
    }
  }
</script>

<div class="space-y-4">
  <!-- Running Totals -->
  <div class="flex items-center justify-between bg-cornholio-dark/50 rounded-lg p-3">
    <div class="text-center flex-1">
      <div class="text-tp-cream text-sm truncate">{team1Name}</div>
      <div class="text-2xl font-bold text-cornholio-gold tabular-nums">{totals.score1}</div>
    </div>
    <div class="text-tp-cream/40 text-xs px-2">vs</div>
    <div class="text-center flex-1">
      <div class="text-tp-cream text-sm truncate">{team2Name}</div>
      <div class="text-2xl font-bold text-cornholio-gold tabular-nums">{totals.score2}</div>
    </div>
  </div>

  {#if !gameFinished}
    <!-- Current Frame Entry -->
    <div class="bg-cornholio-navy/50 border border-cornholio-gray-light/30 rounded-lg p-4">
      <h4 class="text-sm text-cornholio-gold font-heading mb-3">Frame {frames.length + 1}</h4>

      <div class="grid grid-cols-2 gap-4">
        <!-- Team 1 -->
        <div class="space-y-2">
          <div class="text-tp-cream text-xs font-medium truncate">{team1Name}</div>
          <div class="flex items-center gap-2">
            <span class="text-tp-cream/60 text-xs w-14">Holes</span>
            <input
              type="number"
              min="0"
              max="4"
              value={currentFrame.team1Holes}
              oninput={(e) => updateBags(1, 'holes', e.target.value)}
              class="w-14 bg-cornholio-dark border border-cornholio-gold/50 rounded px-2 py-1
                text-cornholio-gold text-center text-sm"
            />
          </div>
          <div class="flex items-center gap-2">
            <span class="text-tp-cream/60 text-xs w-14">Boards</span>
            <input
              type="number"
              min="0"
              max={4 - currentFrame.team1Holes}
              value={currentFrame.team1Boards}
              oninput={(e) => updateBags(1, 'boards', e.target.value)}
              class="w-14 bg-cornholio-dark border border-cornholio-gold/50 rounded px-2 py-1
                text-cornholio-gold text-center text-sm"
            />
          </div>
          <div class="text-tp-cream/50 text-xs">
            Raw: {currentResult.team1Raw}pts
          </div>
        </div>

        <!-- Team 2 -->
        <div class="space-y-2">
          <div class="text-tp-cream text-xs font-medium truncate">{team2Name}</div>
          <div class="flex items-center gap-2">
            <span class="text-tp-cream/60 text-xs w-14">Holes</span>
            <input
              type="number"
              min="0"
              max="4"
              value={currentFrame.team2Holes}
              oninput={(e) => updateBags(2, 'holes', e.target.value)}
              class="w-14 bg-cornholio-dark border border-cornholio-gold/50 rounded px-2 py-1
                text-cornholio-gold text-center text-sm"
            />
          </div>
          <div class="flex items-center gap-2">
            <span class="text-tp-cream/60 text-xs w-14">Boards</span>
            <input
              type="number"
              min="0"
              max={4 - currentFrame.team2Holes}
              value={currentFrame.team2Boards}
              oninput={(e) => updateBags(2, 'boards', e.target.value)}
              class="w-14 bg-cornholio-dark border border-cornholio-gold/50 rounded px-2 py-1
                text-cornholio-gold text-center text-sm"
            />
          </div>
          <div class="text-tp-cream/50 text-xs">
            Raw: {currentResult.team2Raw}pts
          </div>
        </div>
      </div>

      <!-- Frame Result Preview -->
      <div class="mt-3 pt-3 border-t border-cornholio-gray-light/20 text-center">
        {#if currentResult.net > 0}
          <span class="text-cornholio-gold text-sm font-bold">
            {currentResult.scoringTeam === 1 ? team1Name : team2Name} +{currentResult.net}
          </span>
        {:else}
          <span class="text-tp-cream/40 text-sm">Wash (no points)</span>
        {/if}
      </div>

      {#if frameError}
        <div class="text-cornholio-red text-xs mt-2">{frameError}</div>
      {/if}

      <button
        onclick={submitFrame}
        class="w-full mt-3 bg-cornholio-gold text-cornholio-dark font-heading px-4 py-2 rounded
          hover:bg-cornholio-gold-light transition-colors cursor-pointer text-sm"
      >
        SUBMIT FRAME
      </button>
    </div>
  {:else}
    <div class="text-center py-3">
      <span class="text-cornholio-gold font-heading text-lg">GAME COMPLETE!</span>
      <span class="text-tp-cream/60 text-sm ml-2">{totals.score1} - {totals.score2}</span>
    </div>
  {/if}

  <!-- Frame History -->
  {#if frames.length > 0}
    <div class="bg-cornholio-dark/30 rounded-lg p-3">
      <h4 class="text-xs text-tp-cream/50 mb-2 font-heading">FRAME LOG</h4>
      <div class="space-y-1 max-h-40 overflow-y-auto">
        {#each frames as frame, i}
          {@const result = calculateFrameResult(frame)}
          {@const running = calculateRunningTotal(frames.slice(0, i + 1))}
          <div class="flex items-center justify-between text-xs py-1 border-b border-cornholio-gray-light/10">
            <span class="text-tp-cream/40 w-6">F{i + 1}</span>
            <span class="text-tp-cream/60">
              {frame.team1Holes}H {frame.team1Boards}B ({result.team1Raw})
            </span>
            <span class="text-tp-cream/40">vs</span>
            <span class="text-tp-cream/60">
              ({result.team2Raw}) {frame.team2Holes}H {frame.team2Boards}B
            </span>
            <span class="w-16 text-right {result.scoringTeam === 1 ? 'text-cornholio-gold' : result.scoringTeam === 2 ? 'text-cornholio-gold' : 'text-tp-cream/30'}">
              {result.net > 0 ? (result.scoringTeam === 1 ? `T1 +${result.net}` : `T2 +${result.net}`) : 'Wash'}
            </span>
            <span class="w-14 text-right text-tp-white tabular-nums">
              {running.score1}-{running.score2}
            </span>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
