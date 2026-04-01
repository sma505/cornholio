<script>
  import { getState, updateSettings, setStep, setName } from '../stores/tournament.svelte.js'
  import { t } from '../i18n/index.svelte.js'

  const state = getState()

  const formats = $derived([
    {
      id: 'round-robin',
      name: t('format.roundRobin').toUpperCase(),
      desc: t('setup.rrDesc'),
      icon: '🔄',
    },
    {
      id: 'group-playoff',
      name: t('format.groupPlayoff').toUpperCase(),
      desc: t('setup.gpDesc'),
      icon: '🏆',
    },
    {
      id: 'single-elim',
      name: t('format.singleElim').toUpperCase(),
      desc: t('setup.seDesc'),
      icon: '⚡',
    },
    {
      id: 'double-elim',
      name: t('format.doubleElim').toUpperCase(),
      desc: t('setup.deDesc'),
      icon: '💀',
    },
  ])

  function selectFormat(id) {
    updateSettings({ format: id })
  }

  function next() {
    setStep('players')
  }
</script>

<div class="flex-1 flex flex-col items-center px-4 py-8 max-w-4xl mx-auto w-full">
  <h1 class="text-4xl md:text-5xl text-cornholio-gold mb-2">{t('setup.title')}</h1>

  <!-- Tournament Name -->
  <div class="w-full max-w-md mb-6">
    <input
      type="text"
      value={state.name}
      oninput={(e) => setName(e.target.value)}
      placeholder={t('home.namePlaceholder')}
      class="w-full bg-transparent border-b-2 border-cornholio-gold/30 text-tp-white text-center text-lg
        px-2 py-2 focus:border-cornholio-gold focus:outline-none placeholder-tp-cream/30"
    />
  </div>

  <!-- Tournament Type -->
  <div class="w-full max-w-md mb-6">
    <div class="bg-cornholio-gray/50 rounded-lg p-4">
      <label class="text-tp-cream text-sm mb-2 block">{t('setup.tournamentType')}</label>
      <div class="flex gap-2">
        <button
          onclick={() => updateSettings({ tournamentType: 'teams', numCourts: 1 })}
          class="flex-1 py-2 px-3 rounded-lg text-sm font-heading transition-all cursor-pointer border-2
            {state.settings.tournamentType === 'teams'
              ? 'bg-cornholio-gold text-cornholio-dark border-cornholio-gold'
              : 'bg-transparent text-tp-cream/60 border-cornholio-gray-light/50 hover:border-cornholio-gold/50'}"
        >
          {t('setup.teams')}
          <span class="block text-[10px] font-body {state.settings.tournamentType === 'teams' ? 'text-cornholio-dark/60' : 'text-tp-cream/30'}">{t('setup.teamsDesc')}</span>
        </button>
        <button
          onclick={() => updateSettings({ tournamentType: 'singles', numCourts: 2 })}
          class="flex-1 py-2 px-3 rounded-lg text-sm font-heading transition-all cursor-pointer border-2
            {state.settings.tournamentType === 'singles'
              ? 'bg-cornholio-gold text-cornholio-dark border-cornholio-gold'
              : 'bg-transparent text-tp-cream/60 border-cornholio-gray-light/50 hover:border-cornholio-gold/50'}"
        >
          {t('setup.singles')}
          <span class="block text-[10px] font-body {state.settings.tournamentType === 'singles' ? 'text-cornholio-dark/60' : 'text-tp-cream/30'}">{t('setup.singlesDesc')}</span>
        </button>
      </div>
    </div>
  </div>

  <p class="text-tp-cream/60 mb-8">{t('setup.chooseFormat')}</p>

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
      <label class="text-tp-cream text-sm mb-2 block">{t('setup.gameMode')}</label>
      <div class="flex gap-2">
        <button
          onclick={() => updateSettings({ gameMode: 'standard' })}
          class="flex-1 py-2 px-3 rounded-lg text-sm font-heading transition-all cursor-pointer border-2
            {state.settings.gameMode === 'standard'
              ? 'bg-cornholio-gold text-cornholio-dark border-cornholio-gold'
              : 'bg-transparent text-tp-cream/60 border-cornholio-gray-light/50 hover:border-cornholio-gold/50'}"
        >
          {t('mode.standard')}
          <span class="block text-[10px] font-body {state.settings.gameMode === 'standard' ? 'text-cornholio-dark/60' : 'text-tp-cream/30'}">{t('setup.standardDesc')}</span>
        </button>
        <button
          onclick={() => updateSettings({ gameMode: 'quick' })}
          class="flex-1 py-2 px-3 rounded-lg text-sm font-heading transition-all cursor-pointer border-2
            {state.settings.gameMode === 'quick'
              ? 'bg-cornholio-gold text-cornholio-dark border-cornholio-gold'
              : 'bg-transparent text-tp-cream/60 border-cornholio-gray-light/50 hover:border-cornholio-gold/50'}"
        >
          {t('mode.quick')}
          <span class="block text-[10px] font-body {state.settings.gameMode === 'quick' ? 'text-cornholio-dark/60' : 'text-tp-cream/30'}">{t('setup.quickDesc')}</span>
        </button>
      </div>
    </div>

    {#if state.settings.gameMode === 'quick'}
      <div class="bg-cornholio-navy/50 border border-cornholio-gold/20 rounded-lg p-3">
        <p class="text-tp-cream/60 text-xs leading-relaxed">
          <span class="text-cornholio-gold font-bold">{t('setup.quickModeInfo')}</span>
          {t('setup.quickModeInfoText')}
        </p>
      </div>
    {:else}
      <div class="bg-cornholio-navy/50 border border-cornholio-gold/20 rounded-lg p-3">
        <p class="text-tp-cream/60 text-xs leading-relaxed">
          <span class="text-cornholio-gold font-bold">{t('setup.standardModeInfo')}</span>
          {t('setup.standardModeInfoText')}
        </p>
      </div>
    {/if}

    <!-- Scoring Mode -->
    <div class="bg-cornholio-gray/50 rounded-lg p-4">
      <label class="text-tp-cream text-sm mb-2 block">{t('setup.scoringMode')}</label>
      <div class="flex gap-2">
        <button
          onclick={() => updateSettings({ defaultScoringMode: 'quick' })}
          class="flex-1 py-2 px-3 rounded-lg text-sm font-heading transition-all cursor-pointer border-2
            {state.settings.defaultScoringMode === 'quick'
              ? 'bg-cornholio-gold text-cornholio-dark border-cornholio-gold'
              : 'bg-transparent text-tp-cream/60 border-cornholio-gray-light/50 hover:border-cornholio-gold/50'}"
        >
          {t('setup.total')}
          <span class="block text-[10px] font-body {state.settings.defaultScoringMode === 'quick' ? 'text-cornholio-dark/60' : 'text-tp-cream/30'}">{t('setup.totalDesc')}</span>
        </button>
        <button
          onclick={() => updateSettings({ defaultScoringMode: 'frames' })}
          class="flex-1 py-2 px-3 rounded-lg text-sm font-heading transition-all cursor-pointer border-2
            {state.settings.defaultScoringMode === 'frames'
              ? 'bg-cornholio-gold text-cornholio-dark border-cornholio-gold'
              : 'bg-transparent text-tp-cream/60 border-cornholio-gray-light/50 hover:border-cornholio-gold/50'}"
        >
          {t('setup.frameByFrame')}
          <span class="block text-[10px] font-body {state.settings.defaultScoringMode === 'frames' ? 'text-cornholio-dark/60' : 'text-tp-cream/30'}">{t('setup.frameByFrameDesc')}</span>
        </button>
      </div>
    </div>
    <div class="bg-cornholio-navy/50 border border-cornholio-gold/20 rounded-lg p-3">
      <p class="text-tp-cream/60 text-xs leading-relaxed">
        {#if state.settings.defaultScoringMode === 'frames'}
          <span class="text-cornholio-gold font-bold">{t('setup.frameByFrameInfo')}</span>
          {t('setup.frameByFrameInfoText')}
        {:else}
          <span class="text-cornholio-gold font-bold">{t('setup.totalInfo')}</span>
          {t('setup.totalInfoText')}
        {/if}
      </p>
    </div>

    {#if state.settings.gameMode === 'standard'}
      <div class="flex items-center justify-between bg-cornholio-gray/50 rounded-lg p-4">
        <label class="text-tp-cream" for="pointsToWin">{t('setup.pointsToWin')}</label>
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
          <label class="text-tp-cream" for="skunkRule">{t('setup.skunkRule')}</label>
          <p class="text-tp-cream/50 text-xs">{t('setup.skunkRuleDesc', { diff: state.settings.skunkDiff })}</p>
        </div>
        <button
          id="skunkRule"
          aria-label={t('setup.toggleSkunk')}
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
      {#if state.settings.format === 'round-robin' || state.settings.format === 'group-playoff'}
        <div class="flex items-center justify-between bg-cornholio-gray/50 rounded-lg p-4">
          <div>
            <label class="text-tp-cream" for="numFramesGroup">{t('setup.groupRoundRobin')}</label>
            <p class="text-tp-cream/50 text-xs">{t('setup.framesPerGame')}</p>
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
            <label class="text-tp-cream" for="numFramesPlayoff">{t('setup.playoffRounds')}</label>
            <p class="text-tp-cream/50 text-xs">{t('setup.framesPerGame')}</p>
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
            <label class="text-tp-cream" for="numFramesFinals">{t('setup.finalsChampionship')}</label>
            <p class="text-tp-cream/50 text-xs">{t('setup.framesPerGame')}</p>
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
          <label class="text-tp-cream" for="bestOfGroup">{t('setup.groupRoundRobin')}</label>
          <p class="text-tp-cream/50 text-xs">{t('setup.gamesPerMatchup')}</p>
        </div>
        <select
          id="bestOfGroup"
          value={state.settings.bestOfGroup}
          onchange={(e) => updateSettings({ bestOfGroup: parseInt(e.target.value) })}
          class="bg-cornholio-dark border border-cornholio-gold/50 rounded px-3 py-2
            text-cornholio-gold font-bold text-lg cursor-pointer"
        >
          <option value={1}>{t('setup.bo1')}</option>
          <option value={3}>{t('setup.bo3')}</option>
          <option value={5}>{t('setup.bo5')}</option>
        </select>
      </div>
    {/if}

    {#if state.settings.gameMode === 'standard' && state.settings.format !== 'round-robin'}
      <div class="flex items-center justify-between bg-cornholio-gray/50 rounded-lg p-4">
        <div>
          <label class="text-tp-cream" for="bestOfPlayoff">{t('setup.playoffRounds')}</label>
          <p class="text-tp-cream/50 text-xs">{t('setup.gamesPerPlayoff')}</p>
        </div>
        <select
          id="bestOfPlayoff"
          value={state.settings.bestOfPlayoff}
          onchange={(e) => updateSettings({ bestOfPlayoff: parseInt(e.target.value) })}
          class="bg-cornholio-dark border border-cornholio-gold/50 rounded px-3 py-2
            text-cornholio-gold font-bold text-lg cursor-pointer"
        >
          <option value={1}>{t('setup.bo1')}</option>
          <option value={3}>{t('setup.bo3')}</option>
          <option value={5}>{t('setup.bo5')}</option>
        </select>
      </div>

      <div class="flex items-center justify-between bg-cornholio-gray/50 rounded-lg p-4">
        <div>
          <label class="text-tp-cream" for="bestOfFinals">{t('setup.finalsChampionship')}</label>
          <p class="text-tp-cream/50 text-xs">{t('setup.gamesInFinal')}</p>
        </div>
        <select
          id="bestOfFinals"
          value={state.settings.bestOfFinals}
          onchange={(e) => updateSettings({ bestOfFinals: parseInt(e.target.value) })}
          class="bg-cornholio-dark border border-cornholio-gold/50 rounded px-3 py-2
            text-cornholio-gold font-bold text-lg cursor-pointer"
        >
          <option value={1}>{t('setup.bo1')}</option>
          <option value={3}>{t('setup.bo3')}</option>
          <option value={5}>{t('setup.bo5')}</option>
        </select>
      </div>
    {/if}

    {#if state.settings.format === 'group-playoff'}
      <div class="flex items-center justify-between bg-cornholio-gray/50 rounded-lg p-4">
        <div>
          <label class="text-tp-cream" for="numGroups">{t('setup.numGroups')}</label>
          <p class="text-tp-cream/50 text-xs">{t('setup.minTeamsPerGroup')}</p>
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
        <label class="text-tp-cream" for="advancePerGroup">{t('setup.advancePerGroup')}</label>
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
          <span class="text-cornholio-gold font-bold">{t('setup.tip')}</span>
          {t('setup.tipText', { numGroups: state.settings.numGroups, minTeams: state.settings.numGroups * 2, minPlayers: state.settings.numGroups * 2 * 2, recMin: state.settings.numGroups * 3, recMax: state.settings.numGroups * 4 })}
        </p>
      </div>
    {/if}
  </div>

  <!-- Courts -->
  <div class="w-full max-w-md mb-8">
    <div class="flex items-center justify-between bg-cornholio-gray/50 rounded-lg p-4">
      <div>
        <label class="text-tp-cream" for="numCourts">{t('setup.numCourts')}</label>
        <p class="text-tp-cream/50 text-xs">
          {state.settings.numCourts > 1 ? t('setup.courtsParallel', { n: state.settings.numCourts }) : t('setup.courtsSingle')}
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
    {t('common.next')}
  </button>
</div>
