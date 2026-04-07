<script>
  import { calculateFrameResult, calculateRunningTotal, calculateRawTotal, isGameComplete, validateFrame } from '../utils/scoring.js'
  import { t } from '../i18n/index.svelte.js'

  let { team1Name, team2Name, settings, onGameComplete } = $props()

  const isQuick = $derived(settings.gameMode === 'quick')
  const totalFrames = $derived(settings.numFrames || 7)

  let frames = $state([])
  let input1 = $state('')
  let input2 = $state('')
  let frameError = $state(null)
  let gameFinished = $state(false)
  let gameConfirmed = $state(false)

  // Inline edit state
  let editingIndex = $state(null)
  let editInput1 = $state('')
  let editInput2 = $state('')

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
      // Don't call onGameComplete yet — user must confirm
    }
  }

  function undoLastFrame() {
    if (frames.length === 0) return
    frames.pop()
    gameFinished = isGameComplete(frames, settings)
    editingIndex = null
    frameError = null
  }

  function confirmGameResult() {
    const final = calculateRunningTotal(frames)
    onGameComplete?.(final.score1, final.score2, [...frames])
    gameConfirmed = true
  }

  function startEdit(index) {
    editingIndex = index
    editInput1 = String(frames[index].team1Pts)
    editInput2 = String(frames[index].team2Pts)
    frameError = null
  }

  function saveEdit() {
    const team1Pts = parseInt(editInput1) || 0
    const team2Pts = parseInt(editInput2) || 0
    const { valid, errors } = validateFrame({ team1Pts, team2Pts })
    if (!valid) {
      frameError = errors.join('. ')
      return
    }
    frameError = null
    frames[editingIndex] = { team1Pts, team2Pts }

    // In standard mode, if editing an earlier frame now triggers completion,
    // trim frames after that point
    if (settings.gameMode !== 'quick') {
      for (let i = 0; i <= editingIndex; i++) {
        if (isGameComplete(frames.slice(0, i + 1), settings)) {
          frames.length = i + 1
          break
        }
      }
    }

    editingIndex = null
    gameFinished = isGameComplete(frames, settings)
  }

  function cancelEdit() {
    editingIndex = null
    frameError = null
  }

  function handleEditKeydown(e) {
    if (e.key === 'Enter') saveEdit()
    if (e.key === 'Escape') cancelEdit()
  }

  function handleKeydown(e) {
    if (e.key === 'Enter') submitFrame()
  }
</script>

<div class="space-y-2">
  <!-- Score Display -->
  <div class="bg-cornholio-dark/50 rounded-lg py-3 px-4">
    <div class="text-center text-tp-cream/40 text-[10px] uppercase tracking-widest mb-1">{t('common.score')}</div>
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
          {t('play.frameOf', { current: frames.length, total: totalFrames })}
        {:else}
          {totals.score1 === totals.score2 && settings.isBracket ? t('play.suddenDeath', { total: totalFrames }) : t('play.frameOf', { current: totalFrames, total: totalFrames })}
        {/if}
        {#if frames.length > 0}
          {@const raw = calculateRawTotal(frames)}
          <span class="text-tp-cream/20 ml-2">{t('play.rawScore', { raw1: raw.raw1, raw2: raw.raw2 })}</span>
        {/if}
      {:else}
        {t('play.firstTo', { target: settings.pointsToWin || 21 })}
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
    <div class="text-center text-tp-cream/50 text-xs mb-3">
      {t('play.enterRawPoints')}
    </div>

    <div class="flex items-center justify-center gap-2">
      <span class="text-cornholio-gold text-xs font-heading w-8 text-right">{t('play.frame', { n: frames.length + 1 })}</span>
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
        {t('players.add')}
      </button>
    </div>

    <!-- Cancellation Preview -->
    {#if previewPts1 > 0 || previewPts2 > 0}
      <div class="text-center mt-2">
        {#if preview.net > 0}
          <span class="text-cornholio-gold text-sm font-bold">
            {t('play.cancelledGets', { name: preview.scoringTeam === 1 ? team1Name : team2Name, net: preview.net })}
          </span>
        {:else}
          <span class="text-tp-cream/40 text-sm">{t('play.equalNoScore')}</span>
        {/if}
      </div>
    {/if}

    {#if frameError}
      <div class="text-cornholio-red text-xs mt-2 text-center">{frameError}</div>
    {/if}

    {#if frames.length > 0}
      <div class="text-center mt-1">
        <button
          onclick={undoLastFrame}
          class="text-tp-cream/40 text-xs hover:text-cornholio-red transition-colors cursor-pointer
            bg-transparent border-none"
        >
          {t('frames.undoLast')}
        </button>
      </div>
    {/if}
  {:else if !gameConfirmed}
    <!-- Game complete — confirmation gate -->
    <div class="text-center py-4 bg-cornholio-gold/10 rounded-lg space-y-3">
      <span class="text-cornholio-gold font-heading text-lg">{t('play.gameComplete')}</span>
      <div class="text-tp-cream text-sm">{totals.score1} – {totals.score2}</div>
      <div class="flex justify-center gap-3">
        <button
          onclick={undoLastFrame}
          class="text-tp-cream/60 text-sm px-4 py-2 rounded-lg border border-tp-cream/20
            hover:border-cornholio-red hover:text-cornholio-red transition-colors cursor-pointer
            bg-transparent"
        >
          {t('frames.undoLast')}
        </button>
        <button
          onclick={confirmGameResult}
          class="bg-cornholio-gold text-cornholio-dark font-heading px-6 py-2 rounded-lg
            hover:bg-cornholio-gold-light transition-colors cursor-pointer text-sm"
        >
          {t('frames.confirmResult')}
        </button>
      </div>
    </div>

    {#if frameError}
      <div class="text-cornholio-red text-xs mt-2 text-center">{frameError}</div>
    {/if}
  {:else}
    <div class="text-center py-3 bg-cornholio-gold/10 rounded-lg">
      <span class="text-cornholio-gold font-heading text-lg">{t('play.gameComplete')}</span>
      <div class="text-tp-cream text-sm mt-1">{totals.score1} – {totals.score2}</div>
    </div>
  {/if}

  <!-- Frame History -->
  {#if frames.length > 0}
    <div class="bg-cornholio-dark/30 rounded-lg overflow-hidden">
      <table class="w-full text-xs">
        <thead>
          <tr class="text-tp-cream/40 border-b border-cornholio-gray-light/10">
            <th class="py-1.5 px-2 text-left w-10">{t('frames.frame')}</th>
            <th class="py-1.5 px-2 text-center">{t('frames.raw')}</th>
            <th class="py-1.5 px-2 text-center">{t('frames.net')}</th>
            <th class="py-1.5 px-2 text-right">{t('frames.total')}</th>
          </tr>
        </thead>
        <tbody>
          {#each frames as frame, i}
            {#if editingIndex === i}
              <tr class="border-b border-cornholio-gray-light/5 bg-cornholio-navy/40">
                <td class="py-1 px-2 text-tp-cream/30">{t('play.frame', { n: i + 1 })}</td>
                <td class="py-1 px-2 text-center">
                  <input type="number" min="0" max="12"
                    bind:value={editInput1}
                    onkeydown={handleEditKeydown}
                    class="w-10 bg-cornholio-dark border border-cornholio-gold/50 rounded px-1
                      text-cornholio-gold text-center text-xs focus:outline-none focus:border-cornholio-gold"
                  />
                  <span class="text-tp-cream/30 mx-0.5">:</span>
                  <input type="number" min="0" max="12"
                    bind:value={editInput2}
                    onkeydown={handleEditKeydown}
                    class="w-10 bg-cornholio-dark border border-cornholio-gold/50 rounded px-1
                      text-cornholio-gold text-center text-xs focus:outline-none focus:border-cornholio-gold"
                  />
                </td>
                <td colspan="2" class="py-1 px-2 text-right space-x-2">
                  <button onclick={saveEdit}
                    class="text-cornholio-gold text-xs cursor-pointer bg-transparent border-none hover:text-cornholio-gold-light">
                    {t('common.save')}
                  </button>
                  <button onclick={cancelEdit}
                    class="text-tp-cream/40 text-xs cursor-pointer bg-transparent border-none hover:text-tp-cream">
                    {t('common.cancel')}
                  </button>
                </td>
              </tr>
            {:else}
              {@const result = calculateFrameResult(frame)}
              {@const running = calculateRunningTotal(frames.slice(0, i + 1))}
              <tr
                class="border-b border-cornholio-gray-light/5
                  {i === frames.length - 1 ? 'bg-cornholio-navy/30' : ''}
                  {!gameConfirmed ? 'cursor-pointer hover:bg-cornholio-navy/20' : ''}"
                onclick={() => { if (!gameConfirmed) startEdit(i) }}
              >
                <td class="py-1 px-2 text-tp-cream/30">{t('play.frame', { n: i + 1 })}</td>
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
            {/if}
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
