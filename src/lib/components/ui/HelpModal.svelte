<script>
  let { open = $bindable(false) } = $props()

  let activeSection = $state('scoring')

  const sections = [
    { id: 'scoring', label: 'Scoring' },
    { id: 'formats', label: 'Formats' },
    { id: 'modes', label: 'Game Modes' },
    { id: 'settings', label: 'Settings' },
  ]

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
        <h2 class="text-xl font-heading text-cornholio-gold m-0">How to Play</h2>
        <button
          onclick={close}
          class="text-tp-cream/60 hover:text-cornholio-gold text-2xl leading-none bg-transparent border-none cursor-pointer p-1"
          aria-label="Close help"
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
          <h3 class="text-cornholio-gold font-heading text-lg">Cancellation Scoring</h3>
          <p>Cornhole uses <strong class="text-cornholio-gold-light">cancellation scoring</strong> &mdash; each frame, only the team with the higher score keeps the net difference.</p>
          <div class="bg-cornholio-blue/50 rounded-lg p-3 space-y-1">
            <p><strong class="text-cornholio-gold-light">Bag in the hole</strong> = 3 points</p>
            <p><strong class="text-cornholio-gold-light">Bag on the board</strong> = 1 point</p>
            <p>Max per team per frame: 12 pts (4 bags &times; 3 pts)</p>
          </div>
          <p><strong class="text-cornholio-gold-light">Example:</strong> Team A scores 7, Team B scores 4. Only Team A gets points: 7 &minus; 4 = <strong>3 net points</strong>. If both score the same, the frame is a wash &mdash; no points awarded.</p>

          <h3 class="text-cornholio-gold font-heading text-lg mt-6">Score Entry Modes</h3>
          <p>Chosen at tournament creation and applies to all matches:</p>
          <div class="bg-cornholio-blue/50 rounded-lg p-3 space-y-2">
            <p><strong class="text-cornholio-gold-light">Total (Quick Entry)</strong> &mdash; Enter each team's final cancelled score after the match. Fast and simple.</p>
            <p><strong class="text-cornholio-gold-light">Frame-by-Frame</strong> &mdash; Enter raw points per frame for each team. The app calculates cancellation automatically and shows a running total.</p>
          </div>

          <h3 class="text-cornholio-gold font-heading text-lg mt-6">Standings (Round Robin / Groups)</h3>
          <div class="bg-cornholio-blue/50 rounded-lg p-3 space-y-1">
            <p><strong class="text-cornholio-gold-light">Win</strong> = 3 points &nbsp;|&nbsp; <strong class="text-cornholio-gold-light">Draw</strong> = 1 point &nbsp;|&nbsp; <strong class="text-cornholio-gold-light">Loss</strong> = 0 points</p>
            <p class="text-tp-cream/60 text-xs mt-1">Tiebreakers: match points &rarr; head-to-head &rarr; point differential &rarr; total points scored</p>
          </div>

        {:else if activeSection === 'formats'}
          <h3 class="text-cornholio-gold font-heading text-lg">Tournament Formats</h3>

          <div class="space-y-4">
            <div class="bg-cornholio-blue/50 rounded-lg p-3">
              <h4 class="text-cornholio-gold-light font-bold m-0">Round Robin</h4>
              <p class="mt-1">Every team plays every other team. Most matches, fairest standings. Great for smaller groups where everyone wants maximum play time.</p>
            </div>

            <div class="bg-cornholio-blue/50 rounded-lg p-3">
              <h4 class="text-cornholio-gold-light font-bold m-0">Group + Playoff</h4>
              <p class="mt-1">Teams are divided into groups for a round-robin stage (seeded by snake draft). Top teams from each group advance to a single-elimination playoff bracket. Balances fairness with excitement.</p>
              <p class="text-tp-cream/60 text-xs mt-1">Configure: number of groups and how many advance per group.</p>
            </div>

            <div class="bg-cornholio-blue/50 rounded-lg p-3">
              <h4 class="text-cornholio-gold-light font-bold m-0">Single Elimination</h4>
              <p class="mt-1">Lose once and you're out. Fast and dramatic. Top seeds get byes if the bracket size isn't a power of 2. Bracket flows left-to-right on desktop.</p>
            </div>

            <div class="bg-cornholio-blue/50 rounded-lg p-3">
              <h4 class="text-cornholio-gold-light font-bold m-0">Double Elimination</h4>
              <p class="mt-1">Two chances before you're out. Losers from the winners bracket drop to a losers bracket. The two bracket champions meet in a grand final. More forgiving and thorough.</p>
            </div>
          </div>

          <h3 class="text-cornholio-gold font-heading text-lg mt-6">Tournament Types</h3>
          <div class="bg-cornholio-blue/50 rounded-lg p-3 space-y-2">
            <p><strong class="text-cornholio-gold-light">Teams</strong> &mdash; Players paired into teams of 2 (drag-drop or random shuffle). Classic doubles cornhole.</p>
            <p><strong class="text-cornholio-gold-light">Singles</strong> &mdash; 1v1 individual matchups. Skips the team pairing step.</p>
          </div>

        {:else if activeSection === 'modes'}
          <h3 class="text-cornholio-gold font-heading text-lg">Standard Mode</h3>
          <p>Play until one team reaches the target score (default: <strong class="text-cornholio-gold-light">21 points</strong>). The classic cornhole experience.</p>

          <div class="bg-cornholio-blue/50 rounded-lg p-3 space-y-2">
            <p><strong class="text-cornholio-gold-light">Skunk Rule</strong> (optional) &mdash; If one team leads by the skunk threshold (default: 13 points), the game ends immediately. Example: 15&ndash;2 triggers a skunk.</p>
            <p><strong class="text-cornholio-gold-light">Best-of Series</strong> &mdash; Configure per stage: Bo1, Bo3, or Bo5. A Bo3 means first to 2 game wins. Adds depth to elimination rounds.</p>
          </div>

          <h3 class="text-cornholio-gold font-heading text-lg mt-6">Quick Mode</h3>
          <p>Fixed number of frames per match (configurable per stage). Highest cancellation score after all frames wins. Predictable game length &mdash; great for large tournaments or time-limited events.</p>

          <div class="bg-cornholio-blue/50 rounded-lg p-3 space-y-2">
            <p><strong class="text-cornholio-gold-light">Draws allowed</strong> in round-robin and group stages (equal scores after all frames).</p>
            <p><strong class="text-cornholio-gold-light">Sudden death</strong> extra frames break ties in elimination matches.</p>
            <p><strong class="text-cornholio-gold-light">Always Bo1</strong> &mdash; no series in Quick mode.</p>
          </div>

          <div class="bg-cornholio-blue/50 rounded-lg p-3 mt-4">
            <p class="text-tp-cream/60 text-xs"><strong class="text-cornholio-gold-light">Default frames per stage:</strong> Group: 3 &nbsp;|&nbsp; Playoff: 3 &nbsp;|&nbsp; Finals: 3. Configurable from 1&ndash;20.</p>
          </div>

        {:else if activeSection === 'settings'}
          <h3 class="text-cornholio-gold font-heading text-lg">Settings Reference</h3>

          <div class="space-y-3">
            <div class="bg-cornholio-blue/50 rounded-lg p-3">
              <h4 class="text-cornholio-gold-light font-bold m-0">Courts</h4>
              <p class="mt-1">1&ndash;8 courts. Matches are auto-assigned to courts and redistributed as matches complete. Filter by court during play using the court tabs. Default: 1 (teams), 2 (singles).</p>
            </div>

            <div class="bg-cornholio-blue/50 rounded-lg p-3">
              <h4 class="text-cornholio-gold-light font-bold m-0">Points to Win</h4>
              <p class="mt-1">Standard mode only. Default: 21. The first team to reach this score wins the game.</p>
            </div>

            <div class="bg-cornholio-blue/50 rounded-lg p-3">
              <h4 class="text-cornholio-gold-light font-bold m-0">Skunk Rule</h4>
              <p class="mt-1">Standard mode only. When enabled, a game ends early if one team leads by the skunk threshold (default: 13 points).</p>
            </div>

            <div class="bg-cornholio-blue/50 rounded-lg p-3">
              <h4 class="text-cornholio-gold-light font-bold m-0">Best-of Series</h4>
              <p class="mt-1">Standard mode only. Set per stage &mdash; Bo1, Bo3, or Bo5. A Bo3 series requires 2 wins. Quick mode always uses Bo1.</p>
            </div>

            <div class="bg-cornholio-blue/50 rounded-lg p-3">
              <h4 class="text-cornholio-gold-light font-bold m-0">Frames per Stage</h4>
              <p class="mt-1">Quick mode only. Set separately for group, playoff, and finals stages (1&ndash;20 frames each).</p>
            </div>

            <div class="bg-cornholio-blue/50 rounded-lg p-3">
              <h4 class="text-cornholio-gold-light font-bold m-0">Groups &amp; Advancement</h4>
              <p class="mt-1">Group + Playoff format only. Choose number of groups (2&ndash;8) and how many teams advance per group. Need at least 2 teams per group.</p>
            </div>

            <div class="bg-cornholio-blue/50 rounded-lg p-3">
              <h4 class="text-cornholio-gold-light font-bold m-0">Score Entry Mode</h4>
              <p class="mt-1">Set at tournament creation. "Total" for quick entry of final scores, "Frame-by-Frame" for detailed per-frame raw point tracking with automatic cancellation.</p>
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
