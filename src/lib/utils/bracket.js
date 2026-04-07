/**
 * Single- and double-elimination bracket utilities.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Return the next power of 2 that is >= n.
 */
function nextPowerOf2(n) {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/**
 * Build proper seeding order for a bracket of size `size`.
 *
 * For 8 teams: [1,8,4,5,2,7,3,6] which yields matchups
 * 1v8, 4v5, 2v7, 3v6.
 *
 * The algorithm recursively interleaves seeds so that if the higher seed
 * always wins, #1 and #2 meet in the final.
 */
function seedOrder(size) {
  if (size === 1) return [1];

  const half = seedOrder(size / 2);
  const result = [];
  for (const seed of half) {
    result.push(seed);
    result.push(size + 1 - seed);
  }
  return result;
}

/**
 * Create a blank match object.
 */
function createMatch(team1Id, team2Id) {
  return {
    id: crypto.randomUUID(),
    team1Id: team1Id ?? null,
    team2Id: team2Id ?? null,
    score1: null,
    score2: null,
    completed: false,
    nextMatchId: null,
  };
}

// ---------------------------------------------------------------------------
// Single elimination
// ---------------------------------------------------------------------------

/**
 * Generate a single-elimination bracket.
 *
 * Teams are seeded 1-N (array index 0 = seed 1).  When the count is not a
 * power of 2, top seeds receive first-round byes (their opponent is null and
 * the match is auto-completed so they advance).
 *
 * @param {string[]} teamIds — in seed order (index 0 = top seed)
 * @returns {{ winners: Array<{ round: number, matches: object[] }> }}
 */
export function generateSingleElimBracket(teamIds) {
  const n = teamIds.length;
  if (n < 2) {
    return { winners: [] };
  }

  const bracketSize = nextPowerOf2(n);
  const totalRounds = Math.log2(bracketSize);
  const seeds = seedOrder(bracketSize);

  // Map 1-based seeds to teamIds (seeds beyond n get null = bye).
  const teamBySeed = (seed) => (seed <= n ? teamIds[seed - 1] : null);

  // Build all rounds bottom-up so we can wire nextMatchId.
  const rounds = [];

  // --- Round 1 ---
  const round1Matches = [];
  for (let i = 0; i < seeds.length; i += 2) {
    const t1 = teamBySeed(seeds[i]);
    const t2 = teamBySeed(seeds[i + 1]);
    const match = createMatch(t1, t2);

    // Auto-complete bye matches.
    if (t1 === null || t2 === null) {
      match.completed = true;
      match.score1 = t1 !== null ? 0 : null;
      match.score2 = t2 !== null ? 0 : null;
    }

    round1Matches.push(match);
  }
  rounds.push({ round: 1, matches: round1Matches });

  // --- Subsequent rounds ---
  for (let r = 2; r <= totalRounds; r++) {
    const prevMatches = rounds[r - 2].matches;
    const curMatches = [];

    for (let i = 0; i < prevMatches.length; i += 2) {
      const match = createMatch(null, null);
      prevMatches[i].nextMatchId = match.id;
      prevMatches[i + 1].nextMatchId = match.id;

      // If both feeder matches are already completed (byes), advance now.
      const winner1 = getMatchWinner(prevMatches[i]);
      const winner2 = getMatchWinner(prevMatches[i + 1]);

      if (winner1 !== undefined) {
        match.team1Id = winner1;
      }
      if (winner2 !== undefined) {
        match.team2Id = winner2;
      }

      // If both slots filled via byes and one is null (shouldn't happen
      // in proper seeding but guard anyway).
      if (
        match.team1Id !== null &&
        match.team2Id === null &&
        prevMatches[i + 1].completed
      ) {
        // team2 side was a full bye chain — auto-advance team1.
        match.completed = true;
      } else if (
        match.team2Id !== null &&
        match.team1Id === null &&
        prevMatches[i].completed
      ) {
        match.completed = true;
      }

      curMatches.push(match);
    }

    rounds.push({ round: r, matches: curMatches });
  }

  return { winners: rounds };
}

/**
 * Return the winner of a completed match, or undefined if not completed.
 */
function getMatchWinner(match) {
  if (!match.completed) return undefined;
  // Bye: the non-null team wins.
  if (match.team1Id === null) return match.team2Id;
  if (match.team2Id === null) return match.team1Id;
  // Scored match.
  return match.score1 >= match.score2 ? match.team1Id : match.team2Id;
}

/**
 * Return the loser of a completed match, or undefined.
 */
function getMatchLoser(match) {
  if (!match.completed) return undefined;
  if (match.team1Id === null || match.team2Id === null) return null; // bye, no real loser
  return match.score1 >= match.score2 ? match.team2Id : match.team1Id;
}

// ---------------------------------------------------------------------------
// Double elimination
// ---------------------------------------------------------------------------

/**
 * Generate a double-elimination bracket.
 *
 * Structure:
 *   - Winners bracket: same as single elim.
 *   - Losers bracket: losers from winners round N drop into the losers bracket.
 *     Rounds alternate between "minor" rounds (LB teams play each other) and
 *     "drop" rounds (WB losers drop down to face LB survivors).
 *   - Grand finals: winners bracket champion vs losers bracket champion.
 *
 * Each WB match gets a `loserNextMatchId` pointing to its specific LB target.
 * After generation, bye situations (from non-power-of-2 team counts) are
 * auto-resolved so the bracket never deadlocks.
 *
 * @param {string[]} teamIds
 * @returns {{ winners: object[], losers: object[], finals: { matches: object[] } }}
 */
export function generateDoubleElimBracket(teamIds) {
  const n = teamIds.length;
  if (n < 2) {
    return { winners: [], losers: [], finals: { matches: [] } };
  }

  // --- Winners bracket (reuse single elim) ---
  const { winners } = generateSingleElimBracket(teamIds);

  // --- Losers bracket ---
  const winnersRounds = winners.length;
  const losers = [];

  // LB round 0 (minor): WB-R0 losers play each other.
  let lbMatchCount = Math.floor(winners[0].matches.length / 2);
  if (lbMatchCount > 0) {
    const lbR0Matches = Array.from({ length: lbMatchCount }, () => createMatch(null, null));
    losers.push({ round: 1, matches: lbR0Matches });

    // Wire WB R0 losers → LB R0 (two WB losers per LB match)
    for (let i = 0; i < winners[0].matches.length; i++) {
      const lbIdx = Math.floor(i / 2);
      if (lbIdx < lbR0Matches.length) {
        winners[0].matches[i].loserNextMatchId = lbR0Matches[lbIdx].id;
      }
    }
  }

  // For subsequent WB rounds: drop round + optional minor round.
  for (let wbr = 1; wbr < winnersRounds; wbr++) {
    const dropCount = winners[wbr].matches.length;
    const dropMatches = Array.from({ length: dropCount }, () => createMatch(null, null));
    losers.push({ round: losers.length + 1, matches: dropMatches });

    // Wire WB Rwbr losers → this drop round
    for (let i = 0; i < winners[wbr].matches.length; i++) {
      if (i < dropMatches.length) {
        winners[wbr].matches[i].loserNextMatchId = dropMatches[i].id;
      }
    }

    // Minor round: remaining LB teams play each other (halve the field).
    if (dropCount > 1) {
      const minorCount = Math.floor(dropCount / 2);
      losers.push({
        round: losers.length + 1,
        matches: Array.from({ length: minorCount }, () => createMatch(null, null)),
      });
    }
  }

  // Wire nextMatchId within losers bracket.
  for (let i = 0; i < losers.length - 1; i++) {
    const cur = losers[i].matches;
    const next = losers[i + 1].matches;

    for (let m = 0; m < cur.length; m++) {
      const nextIndex = Math.floor(m / (cur.length / next.length || 1));
      if (next[Math.min(nextIndex, next.length - 1)]) {
        cur[m].nextMatchId = next[Math.min(nextIndex, next.length - 1)].id;
      }
    }
  }

  // --- Grand finals ---
  const grandFinal = createMatch(null, null);

  // Wire WB final winner and LB final winner into grand finals.
  if (winners.length > 0) {
    const wbFinal = winners[winnersRounds - 1].matches[0];
    wbFinal.nextMatchId = grandFinal.id;
  }
  if (losers.length > 0) {
    const lbFinal = losers[losers.length - 1].matches[0];
    lbFinal.nextMatchId = grandFinal.id;
  }

  const bracket = { winners, losers, finals: { matches: [grandFinal] } };

  // Resolve bye-induced auto-advances (e.g. 3-team bracket where LB R0 only
  // gets 1 real loser because WB R0 had a bye).
  resolveByeAdvances(bracket);

  return bracket;
}

// ---------------------------------------------------------------------------
// Bracket advancement
// ---------------------------------------------------------------------------

/**
 * Find a match by ID across all bracket sections.
 *
 * @returns {{ match, section: 'winners'|'losers'|'finals', roundIdx, matchIdx } | null}
 */
function findMatch(bracket, matchId) {
  for (const section of ['winners', 'losers', 'finals']) {
    const rounds = bracket[section];
    if (!rounds) continue;

    // finals is { matches: [...] }
    if (section === 'finals') {
      const matches = rounds.matches ?? [];
      const idx = matches.findIndex((m) => m.id === matchId);
      if (idx !== -1) return { match: matches[idx], section, roundIdx: 0, matchIdx: idx };
      continue;
    }

    for (let r = 0; r < rounds.length; r++) {
      const idx = rounds[r].matches.findIndex((m) => m.id === matchId);
      if (idx !== -1) {
        return { match: rounds[r].matches[idx], section, roundIdx: r, matchIdx: idx };
      }
    }
  }
  return null;
}

/**
 * Find the match with a given ID and place a team into its first open slot.
 */
function placeTeamInMatch(bracket, matchId, teamId) {
  const found = findMatch(bracket, matchId);
  if (!found) return;

  const { match } = found;
  if (match.team1Id === null) {
    match.team1Id = teamId;
  } else if (match.team2Id === null) {
    match.team2Id = teamId;
  }
}

/**
 * Advance a bracket after recording a match result.
 *
 * Marks the match as completed, places the winner in their next match.  For
 * double-elimination brackets, also places the loser in the appropriate
 * losers bracket match via the explicit `loserNextMatchId` wiring set during
 * generation.  After placement, auto-resolves any bye matches in the losers
 * bracket that now have all their feeders completed.
 *
 * Mutates `bracket` in place and returns it.
 *
 * @param {object} bracket
 * @param {string} matchId
 * @param {string} winnerId
 * @param {string} loserId
 * @returns {object} the updated bracket
 */
export function advanceBracket(bracket, matchId, winnerId, loserId) {
  const found = findMatch(bracket, matchId);
  if (!found) return bracket;

  const { match, section } = found;
  match.completed = true;

  // Place winner in next match.
  if (match.nextMatchId) {
    placeTeamInMatch(bracket, match.nextMatchId, winnerId);
  }

  // Double-elim: send the loser to their explicit LB target match.
  if (section === 'winners' && loserId && match.loserNextMatchId) {
    placeTeamInMatch(bracket, match.loserNextMatchId, loserId);
  }

  // Auto-resolve any LB byes that are now unblocked.
  resolveByeAdvances(bracket);

  return bracket;
}

// ---------------------------------------------------------------------------
// Bye resolution
// ---------------------------------------------------------------------------

/**
 * Collect every match in the bracket (winners, losers, finals).
 */
function collectAllMatches(bracket) {
  const result = [];
  for (const section of ['winners', 'losers']) {
    const rounds = bracket[section];
    if (!rounds) continue;
    for (const round of rounds) {
      result.push(...round.matches);
    }
  }
  if (bracket.finals?.matches) {
    result.push(...bracket.finals.matches);
  }
  return result;
}

/**
 * After any advancement (or initial generation), scan the losers bracket and
 * finals for matches that have received all their expected teams but only have
 * one (or zero) — i.e. bye situations caused by non-power-of-2 team counts.
 *
 * A match is a bye when:
 *   - It has 0 or 1 real team, AND
 *   - No uncompleted match feeds into it (via nextMatchId or loserNextMatchId)
 *
 * Bye matches are auto-completed and their sole team (if any) is advanced.
 * This repeats until no more byes can be resolved (handles cascading byes).
 */
function resolveByeAdvances(bracket) {
  if (!bracket.losers && !bracket.finals) return;

  const all = collectAllMatches(bracket);

  let changed = true;
  while (changed) {
    changed = false;

    // Check losers bracket and finals for auto-advanceable matches
    const sections = [];
    if (bracket.losers) {
      for (const round of bracket.losers) sections.push(...round.matches);
    }
    if (bracket.finals?.matches) sections.push(...bracket.finals.matches);

    for (const match of sections) {
      if (match.completed) continue;

      const hasTeam1 = match.team1Id !== null;
      const hasTeam2 = match.team2Id !== null;

      // Already has both teams — ready to play, not a bye
      if (hasTeam1 && hasTeam2) continue;

      // Check if any uncompleted match still feeds into this one
      const hasPendingFeeder = all.some(
        (m) =>
          !m.completed &&
          m.id !== match.id &&
          (m.nextMatchId === match.id || m.loserNextMatchId === match.id)
      );

      if (hasPendingFeeder) continue;

      // No more teams can arrive. Auto-complete.
      match.completed = true;
      const winner = match.team1Id || match.team2Id;

      if (winner) {
        // Single-team bye: advance the team
        match.score1 = hasTeam1 ? 0 : null;
        match.score2 = hasTeam2 ? 0 : null;

        if (match.nextMatchId) {
          placeTeamInMatch(bracket, match.nextMatchId, winner);
        }
      }
      // Zero-team match: just mark completed, nothing to advance

      changed = true;
    }
  }
}

// ---------------------------------------------------------------------------
// State-machine query helpers
// ---------------------------------------------------------------------------

/**
 * Return all matches that are ready to be played (not completed, both teams
 * present).  Works for any bracket type.
 *
 * @param {object} bracket
 * @returns {object[]}
 */
export function getPlayableMatches(bracket) {
  return collectAllMatches(bracket).filter(
    (m) => !m.completed && m.team1Id !== null && m.team2Id !== null
  );
}

/**
 * True when the bracket has no playable matches but no winner yet — a state
 * that should never occur with correct bracket logic.
 *
 * @param {object} bracket
 * @returns {boolean}
 */
export function isBracketDeadlocked(bracket) {
  if (getBracketWinner(bracket) !== null) return false;
  return getPlayableMatches(bracket).length === 0;
}

// ---------------------------------------------------------------------------
// Bracket winner
// ---------------------------------------------------------------------------

/**
 * Return the tournament champion's team ID, or null if the bracket is not yet
 * complete.
 *
 * @param {object} bracket
 * @returns {string|null}
 */
export function getBracketWinner(bracket) {
  // Double-elim: check grand finals.
  if (bracket.finals && bracket.finals.matches && bracket.finals.matches.length > 0) {
    const gf = bracket.finals.matches[bracket.finals.matches.length - 1];
    if (gf.completed) {
      return getMatchWinner(gf) ?? null;
    }
    return null;
  }

  // Single-elim: check the last winners round.
  if (bracket.winners && bracket.winners.length > 0) {
    const finalRound = bracket.winners[bracket.winners.length - 1];
    const finalMatch = finalRound.matches[0];
    if (finalMatch && finalMatch.completed) {
      return getMatchWinner(finalMatch) ?? null;
    }
  }

  return null;
}
