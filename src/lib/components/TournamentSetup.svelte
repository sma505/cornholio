<script>
  import { getState, updateSettings, setStep, setName } from '../stores/tournament.svelte.js'

  const state = getState()

  const formats = [
    {
      id: 'round-robin',
      name: 'ROUND ROBIN',
      desc: 'Every team plays every other team. Most games, fairest standings.',
      icon: '🔄',
    },
    {
      id: 'group-playoff',
      name: 'GROUP + PLAYOFF',
      desc: 'Group stage round-robin, then top teams advance to elimination bracket.',
      icon: '🏆',
    },
    {
      id: 'single-elim',
      name: 'SINGLE ELIMINATION',
      desc: 'Lose once and you\'re out. Fast and dramatic.',
      icon: '⚡',
    },
    {
      id: 'double-elim',
      name: 'DOUBLE ELIMINATION',
      desc: 'Two chances before elimination. Winners and losers brackets.',
      icon: '💀',
    },
  ]

  function selectFormat(id) {
    updateSettings({ format: id })
  }

  function next() {
    setStep('players')
  }
</script>

<div class="flex-1 flex flex-col items-center px-4 py-8 max-w-4xl mx-auto w-full">
  <h1 class="text-4xl md:text-5xl text-cornholio-gold mb-2">TOURNAMENT SETUP</h1>

  <!-- Tournament Name -->
  <div class="w-full max-w-md mb-6">
    <input
      type="text"
      value={state.name}
      oninput={(e) => setName(e.target.value)}
      placeholder="Tournament name..."
      class="w-full bg-transparent border-b-2 border-cornholio-gold/30 text-tp-white text-center text-lg
        px-2 py-2 focus:border-cornholio-gold focus:outline-none placeholder-tp-cream/30"
    />
  </div>

  <!-- Tournament Type -->
  <div class="w-full max-w-md mb-6">
    <div class="bg-cornholio-gray/50 rounded-lg p-4">
      <label class="text-tp-cream text-sm mb-2 block">Tournament Type</label>
      <div class="flex gap-2">
        <button
          onclick={() => updateSettings({ tournamentType: 'teams', numCourts: 1 })}
          class="flex-1 py-2 px-3 rounded-lg text-sm font-heading transition-all cursor-pointer border-2
            {state.settings.tournamentType === 'teams'
              ? 'bg-cornholio-gold text-cornholio-dark border-cornholio-gold'
              : 'bg-transparent text-tp-cream/60 border-cornholio-gray-light/50 hover:border-cornholio-gold/50'}"
        >
          Teams
          <span class="block text-[10px] font-body {state.settings.tournamentType === 'teams' ? 'text-cornholio-dark/60' : 'text-tp-cream/30'}">Pairs of 2 players</span>
        </button>
        <button
          onclick={() => updateSettings({ tournamentType: 'singles', numCourts: 2 })}
          class="flex-1 py-2 px-3 rounded-lg text-sm font-heading transition-all cursor-pointer border-2
            {state.settings.tournamentType === 'singles'
              ? 'bg-cornholio-gold text-cornholio-dark border-cornholio-gold'
              : 'bg-transparent text-tp-cream/60 border-cornholio-gray-light/50 hover:border-cornholio-gold/50'}"
        >
          Singles
          <span class="block text-[10px] font-body {state.settings.tournamentType === 'singles' ? 'text-cornholio-dark/60' : 'text-tp-cream/30'}">1v1 matchups</span>
        </button>
      </div>
    </div>
  </div>

  <p class="text-tp-cream/60 mb-8">Choose your format, mortal.</p>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-8">
    {#each formats as fmt}
      <button
        onclick={() => selectFormat(fmt.id)}
        class="text-left p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer
          {state.settings.format === fmt.id
            ? 'bg-cornholio-navy border-cornholio-gold shadow-lg shadow-cornholio-gold/20 scale-[1.02]'
            : 'bg-cornholio-gray/50 border-cornholio-gray-light/50 hover:border-cornholio-gold/50'}"
      >
        <div class="text-3xl mb-2">{fmt.icon}</div>
        <h3 class="text-xl text-cornholio-gold font-heading tracking-wide mb-1">{fmt.name}</h3>
        <p class="text-tp-cream/70 text-sm">{fmt.desc}</p>
      </button>
    {/each}
  </div>

  <div class="w-full max-w-md space-y-4 mb-8">
    <!-- Game Mode -->
    <div class="bg-cornholio-gray/50 rounded-lg p-4">
      <label class="text-tp-cream text-sm mb-2 block">Game Mode</label>
      <div class="flex gap-2">
        <button
          onclick={() => updateSettings({ gameMode: 'standard' })}
          class="flex-1 py-2 px-3 rounded-lg text-sm font-heading transition-all cursor-pointer border-2
            {state.settings.gameMode === 'standard'
              ? 'bg-cornholio-gold text-cornholio-dark border-cornholio-gold'
              : 'bg-transparent text-tp-cream/60 border-cornholio-gray-light/50 hover:border-cornholio-gold/50'}"
        >
          Standard
          <span class="block text-[10px] font-body {state.settings.gameMode === 'standard' ? 'text-cornholio-dark/60' : 'text-tp-cream/30'}">Play to target score</span>
        </button>
        <button
          onclick={() => updateSettings({ gameMode: 'quick' })}
          class="flex-1 py-2 px-3 rounded-lg text-sm font-heading transition-all cursor-pointer border-2
            {state.settings.gameMode === 'quick'
              ? 'bg-cornholio-gold text-cornholio-dark border-cornholio-gold'
              : 'bg-transparent text-tp-cream/60 border-cornholio-gray-light/50 hover:border-cornholio-gold/50'}"
        >
          Quick
          <span class="block text-[10px] font-body {state.settings.gameMode === 'quick' ? 'text-cornholio-dark/60' : 'text-tp-cream/30'}">Fixed frames, count points</span>
        </button>
      </div>
    </div>

    <!-- Scoring Mode -->
    <div class="bg-cornholio-gray/50 rounded-lg p-4">
      <label class="text-tp-cream text-sm mb-2 block">Scoring Mode</label>
      <div class="flex gap-2">
        <button
          onclick={() => updateSettings({ defaultScoringMode: 'quick' })}
          class="flex-1 py-2 px-3 rounded-lg text-sm font-heading transition-all cursor-pointer border-2
            {state.settings.defaultScoringMode === 'quick'
              ? 'bg-cornholio-gold text-cornholio-dark border-cornholio-gold'
              : 'bg-transparent text-tp-cream/60 border-cornholio-gray-light/50 hover:border-cornholio-gold/50'}"
        >
          Total
          <span class="block text-[10px] font-body {state.settings.defaultScoringMode === 'quick' ? 'text-cornholio-dark/60' : 'text-tp-cream/30'}">Enter final score</span>
        </button>
        <button
          onclick={() => updateSettings({ defaultScoringMode: 'frames' })}
          class="flex-1 py-2 px-3 rounded-lg text-sm font-heading transition-all cursor-pointer border-2
            {state.settings.defaultScoringMode === 'frames'
              ? 'bg-cornholio-gold text-cornholio-dark border-cornholio-gold'
              : 'bg-transparent text-tp-cream/60 border-cornholio-gray-light/50 hover:border-cornholio-gold/50'}"
        >
          Frame-by-frame
          <span class="block text-[10px] font-body {state.settings.defaultScoringMode === 'frames' ? 'text-cornholio-dark/60' : 'text-tp-cream/30'}">Enter per frame</span>
        </button>
      </div>
      <p class="text-tp-cream/40 text-xs mt-2 leading-relaxed">
        {#if state.settings.defaultScoringMode === 'frames'}
          Enter each team's <span class="text-tp-cream/60">raw points per frame</span> (hole = 3, board = 1). The app calculates cancellation scoring automatically.
        {:else}
          Enter each team's <span class="text-tp-cream/60">final cancelled score</span> after all frames are played.
        {/if}
      </p>
    </div>

    {#if state.settings.gameMode === 'standard'}
      <div class="flex items-center justify-between bg-cornholio-gray/50 rounded-lg p-4">
        <label class="text-tp-cream" for="pointsToWin">Points to Win</label>
        <input
          id="pointsToWin"
          type="number"
          min="1"
          max="99"
          value={state.settings.pointsToWin}
          oninput={(e) => updateSettings({ pointsToWin: parseInt(e.target.value) || 21 })}
          class="w-20 bg-cornholio-dark border border-cornholio-gold/50 rounded px-3 py-2
            text-cornholio-gold text-center font-bold text-lg"
        />
      </div>

      <div class="flex items-center justify-between bg-cornholio-gray/50 rounded-lg p-4">
        <div>
          <label class="text-tp-cream" for="skunkRule">Skunk Rule</label>
          <p class="text-tp-cream/50 text-xs">Win instantly if leading by {state.settings.skunkDiff}+</p>
        </div>
        <button
          id="skunkRule"
          aria-label="Toggle skunk rule"
          onclick={() => updateSettings({ skunkRule: !state.settings.skunkRule })}
          class="w-14 h-8 rounded-full transition-colors duration-200 cursor-pointer border-none
            {state.settings.skunkRule ? 'bg-cornholio-gold' : 'bg-cornholio-gray-light'}"
        >
          <div
            class="w-6 h-6 rounded-full bg-white shadow transition-transform duration-200
              {state.settings.skunkRule ? 'translate-x-7' : 'translate-x-1'}"
          ></div>
        </button>
      </div>
    {:else}
      <div class="bg-cornholio-navy/50 border border-cornholio-gold/20 rounded-lg p-3 mb-1">
        <p class="text-tp-cream/60 text-xs leading-relaxed">
          <span class="text-cornholio-gold font-bold">Quick Mode:</span>
          Play a fixed number of frames per game. Highest cancellation score wins. Draws possible in group stage.
        </p>
      </div>

      {#if state.settings.format === 'round-robin' || state.settings.format === 'group-playoff'}
        <div class="flex items-center justify-between bg-cornholio-gray/50 rounded-lg p-4">
          <div>
            <label class="text-tp-cream" for="numFramesGroup">Group / Round Robin</label>
            <p class="text-tp-cream/50 text-xs">Frames per game</p>
          </div>
          <input
            id="numFramesGroup"
            type="number"
            min="1"
            max="20"
            value={state.settings.numFramesGroup}
            oninput={(e) => updateSettings({ numFramesGroup: parseInt(e.target.value) || 3 })}
            class="w-20 bg-cornholio-dark border border-cornholio-gold/50 rounded px-3 py-2
              text-cornholio-gold text-center font-bold text-lg"
          />
        </div>
      {/if}

      {#if state.settings.format !== 'round-robin'}
        <div class="flex items-center justify-between bg-cornholio-gray/50 rounded-lg p-4">
          <div>
            <label class="text-tp-cream" for="numFramesPlayoff">Playoff Rounds</label>
            <p class="text-tp-cream/50 text-xs">Frames per game</p>
          </div>
          <input
            id="numFramesPlayoff"
            type="number"
            min="1"
            max="20"
            value={state.settings.numFramesPlayoff}
            oninput={(e) => updateSettings({ numFramesPlayoff: parseInt(e.target.value) || 5 })}
            class="w-20 bg-cornholio-dark border border-cornholio-gold/50 rounded px-3 py-2
              text-cornholio-gold text-center font-bold text-lg"
          />
        </div>

        <div class="flex items-center justify-between bg-cornholio-gray/50 rounded-lg p-4">
          <div>
            <label class="text-tp-cream" for="numFramesFinals">Finals / Championship</label>
            <p class="text-tp-cream/50 text-xs">Frames per game</p>
          </div>
          <input
            id="numFramesFinals"
            type="number"
            min="1"
            max="20"
            value={state.settings.numFramesFinals}
            oninput={(e) => updateSettings({ numFramesFinals: parseInt(e.target.value) || 7 })}
            class="w-20 bg-cornholio-dark border border-cornholio-gold/50 rounded px-3 py-2
              text-cornholio-gold text-center font-bold text-lg"
          />
        </div>
      {/if}
    {/if}

    <!-- Best-of Series Settings (standard mode only) -->
    {#if state.settings.gameMode === 'standard' && (state.settings.format === 'round-robin' || state.settings.format === 'group-playoff')}
      <div class="flex items-center justify-between bg-cornholio-gray/50 rounded-lg p-4">
        <div>
          <label class="text-tp-cream" for="bestOfGroup">Group / Round Robin</label>
          <p class="text-tp-cream/50 text-xs">Games per matchup</p>
        </div>
        <select
          id="bestOfGroup"
          value={state.settings.bestOfGroup}
          onchange={(e) => updateSettings({ bestOfGroup: parseInt(e.target.value) })}
          class="bg-cornholio-dark border border-cornholio-gold/50 rounded px-3 py-2
            text-cornholio-gold font-bold text-lg cursor-pointer"
        >
          <option value={1}>Bo1</option>
          <option value={3}>Bo3</option>
          <option value={5}>Bo5</option>
        </select>
      </div>
    {/if}

    {#if state.settings.gameMode === 'standard' && state.settings.format !== 'round-robin'}
      <div class="flex items-center justify-between bg-cornholio-gray/50 rounded-lg p-4">
        <div>
          <label class="text-tp-cream" for="bestOfPlayoff">Playoff Rounds</label>
          <p class="text-tp-cream/50 text-xs">Games per playoff matchup</p>
        </div>
        <select
          id="bestOfPlayoff"
          value={state.settings.bestOfPlayoff}
          onchange={(e) => updateSettings({ bestOfPlayoff: parseInt(e.target.value) })}
          class="bg-cornholio-dark border border-cornholio-gold/50 rounded px-3 py-2
            text-cornholio-gold font-bold text-lg cursor-pointer"
        >
          <option value={1}>Bo1</option>
          <option value={3}>Bo3</option>
          <option value={5}>Bo5</option>
        </select>
      </div>

      <div class="flex items-center justify-between bg-cornholio-gray/50 rounded-lg p-4">
        <div>
          <label class="text-tp-cream" for="bestOfFinals">Finals / Championship</label>
          <p class="text-tp-cream/50 text-xs">Games in the final matchup</p>
        </div>
        <select
          id="bestOfFinals"
          value={state.settings.bestOfFinals}
          onchange={(e) => updateSettings({ bestOfFinals: parseInt(e.target.value) })}
          class="bg-cornholio-dark border border-cornholio-gold/50 rounded px-3 py-2
            text-cornholio-gold font-bold text-lg cursor-pointer"
        >
          <option value={1}>Bo1</option>
          <option value={3}>Bo3</option>
          <option value={5}>Bo5</option>
        </select>
      </div>
    {/if}

    {#if state.settings.format === 'group-playoff'}
      <div class="flex items-center justify-between bg-cornholio-gray/50 rounded-lg p-4">
        <div>
          <label class="text-tp-cream" for="numGroups">Number of Groups</label>
          <p class="text-tp-cream/50 text-xs">Each group needs at least 2 teams</p>
        </div>
        <input
          id="numGroups"
          type="number"
          min="2"
          max="8"
          value={state.settings.numGroups}
          oninput={(e) => updateSettings({ numGroups: parseInt(e.target.value) || 2 })}
          class="w-20 bg-cornholio-dark border border-cornholio-gold/50 rounded px-3 py-2
            text-cornholio-gold text-center font-bold text-lg"
        />
      </div>

      <div class="flex items-center justify-between bg-cornholio-gray/50 rounded-lg p-4">
        <label class="text-tp-cream" for="advancePerGroup">Advance per Group</label>
        <input
          id="advancePerGroup"
          type="number"
          min="1"
          max="4"
          value={state.settings.advancePerGroup}
          oninput={(e) => updateSettings({ advancePerGroup: parseInt(e.target.value) || 2 })}
          class="w-20 bg-cornholio-dark border border-cornholio-gold/50 rounded px-3 py-2
            text-cornholio-gold text-center font-bold text-lg"
        />
      </div>

      <div class="bg-cornholio-navy/50 border border-cornholio-gold/20 rounded-lg p-3">
        <p class="text-tp-cream/60 text-xs leading-relaxed">
          <span class="text-cornholio-gold font-bold">Tip:</span>
          For {state.settings.numGroups} groups you need at least {state.settings.numGroups * 2} teams
          ({state.settings.numGroups * 2 * 2}+ players). Recommended: {state.settings.numGroups * 3}–{state.settings.numGroups * 4} teams
          for balanced groups.
        </p>
      </div>
    {/if}
  </div>

  <!-- Courts -->
  <div class="w-full max-w-md mb-8">
    <div class="flex items-center justify-between bg-cornholio-gray/50 rounded-lg p-4">
      <div>
        <label class="text-tp-cream" for="numCourts">Number of Courts</label>
        <p class="text-tp-cream/50 text-xs">
          {state.settings.numCourts > 1 ? `${state.settings.numCourts} matches can run in parallel` : 'One match at a time'}
        </p>
      </div>
      <input
        id="numCourts"
        type="number"
        min="1"
        max="8"
        value={state.settings.numCourts}
        oninput={(e) => updateSettings({ numCourts: parseInt(e.target.value) || 1 })}
        class="w-20 bg-cornholio-dark border border-cornholio-gold/50 rounded px-3 py-2
          text-cornholio-gold text-center font-bold text-lg"
      />
    </div>
  </div>

  <button
    onclick={next}
    class="bg-cornholio-gold text-cornholio-dark font-heading text-2xl px-10 py-3 rounded-lg
      hover:bg-cornholio-gold-light hover:scale-105 transition-all duration-200
      cursor-pointer shadow-lg"
  >
    NEXT →
  </button>
</div>
