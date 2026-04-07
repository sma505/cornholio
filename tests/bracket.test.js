import { describe, it, expect } from 'vitest';
import {
  generateSingleElimBracket,
  generateDoubleElimBracket,
  advanceBracket,
  getBracketWinner,
  getPlayableMatches,
  isBracketDeadlocked,
} from '../src/lib/utils/bracket.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function allMatches(bracket) {
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

function findMatchById(bracket, id) {
  return allMatches(bracket).find((m) => m.id === id) ?? null;
}

// ---------------------------------------------------------------------------
// generateSingleElimBracket
// ---------------------------------------------------------------------------

describe('generateSingleElimBracket', () => {
  it('1 team returns empty bracket', () => {
    const bracket = generateSingleElimBracket(['a']);
    expect(bracket.winners).toEqual([]);
  });

  it('2 teams → 1 round, 1 match, correct positions', () => {
    const bracket = generateSingleElimBracket(['a', 'b']);
    const { winners } = bracket;

    expect(winners).toHaveLength(1);
    expect(winners[0].round).toBe(1);
    expect(winners[0].matches).toHaveLength(1);

    const match = winners[0].matches[0];
    expect(match.team1Id).toBe('a');
    expect(match.team2Id).toBe('b');
    expect(match.completed).toBe(false);
    expect(match.nextMatchId).toBeNull();
  });

  it('4 teams → 2 rounds with proper seeding (1v4, 2v3)', () => {
    const bracket = generateSingleElimBracket(['t1', 't2', 't3', 't4']);
    const { winners } = bracket;

    expect(winners).toHaveLength(2);

    // Round 1: 2 matches
    const r1 = winners[0].matches;
    expect(r1).toHaveLength(2);

    // Seed order for 4: [1,4,2,3] → matchups 1v4, 2v3
    expect(r1[0].team1Id).toBe('t1');
    expect(r1[0].team2Id).toBe('t4');
    expect(r1[1].team1Id).toBe('t2');
    expect(r1[1].team2Id).toBe('t3');

    // Round 2: 1 match (the final)
    const r2 = winners[1].matches;
    expect(r2).toHaveLength(1);
    expect(r2[0].team1Id).toBeNull();
    expect(r2[0].team2Id).toBeNull();
    expect(r2[0].nextMatchId).toBeNull();
  });

  it('8 teams → 3 rounds with full seeding', () => {
    const ids = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'];
    const bracket = generateSingleElimBracket(ids);
    const { winners } = bracket;

    expect(winners).toHaveLength(3);

    // Round 1: 4 matches
    const r1 = winners[0].matches;
    expect(r1).toHaveLength(4);

    // Seed order for 8: [1,8,4,5,2,7,3,6]
    // Matchups: 1v8, 4v5, 2v7, 3v6
    expect(r1[0].team1Id).toBe('s1');
    expect(r1[0].team2Id).toBe('s8');
    expect(r1[1].team1Id).toBe('s4');
    expect(r1[1].team2Id).toBe('s5');
    expect(r1[2].team1Id).toBe('s2');
    expect(r1[2].team2Id).toBe('s7');
    expect(r1[3].team1Id).toBe('s3');
    expect(r1[3].team2Id).toBe('s6');

    // Round 2: 2 matches, Round 3: 1 match (final)
    expect(winners[1].matches).toHaveLength(2);
    expect(winners[2].matches).toHaveLength(1);

    // Final has no nextMatchId
    expect(winners[2].matches[0].nextMatchId).toBeNull();
  });

  it('3 teams → 4-slot bracket with 1 bye', () => {
    const bracket = generateSingleElimBracket(['a', 'b', 'c']);
    const { winners } = bracket;

    // nextPowerOf2(3) = 4 → 2 rounds
    expect(winners).toHaveLength(2);

    const r1 = winners[0].matches;
    expect(r1).toHaveLength(2);

    // One match should be a bye (one side is null and completed)
    const byeMatches = r1.filter((m) => m.team1Id === null || m.team2Id === null);
    expect(byeMatches).toHaveLength(1);
    expect(byeMatches[0].completed).toBe(true);

    // The non-bye match should have two real teams and not be completed
    const realMatches = r1.filter((m) => m.team1Id !== null && m.team2Id !== null);
    expect(realMatches).toHaveLength(1);
    expect(realMatches[0].completed).toBe(false);
  });

  it('5 teams → 8-slot bracket with 3 byes', () => {
    const ids = ['a', 'b', 'c', 'd', 'e'];
    const bracket = generateSingleElimBracket(ids);
    const { winners } = bracket;

    // nextPowerOf2(5) = 8 → 3 rounds
    expect(winners).toHaveLength(3);

    const r1 = winners[0].matches;
    expect(r1).toHaveLength(4);

    // Seeds 6, 7, 8 don't exist → 3 bye matches
    const byeMatches = r1.filter((m) => m.team1Id === null || m.team2Id === null);
    expect(byeMatches).toHaveLength(3);
    byeMatches.forEach((m) => {
      expect(m.completed).toBe(true);
    });
  });

  it('6 teams → 8-slot bracket with 2 byes', () => {
    const ids = ['a', 'b', 'c', 'd', 'e', 'f'];
    const bracket = generateSingleElimBracket(ids);
    const { winners } = bracket;

    // nextPowerOf2(6) = 8 → 3 rounds
    expect(winners).toHaveLength(3);

    const r1 = winners[0].matches;
    expect(r1).toHaveLength(4);

    // Seeds 7, 8 don't exist → 2 bye matches
    const byeMatches = r1.filter((m) => m.team1Id === null || m.team2Id === null);
    expect(byeMatches).toHaveLength(2);
    byeMatches.forEach((m) => {
      expect(m.completed).toBe(true);
    });
  });

  it('all matches have nextMatchId wired except the final', () => {
    const bracket = generateSingleElimBracket(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
    const { winners } = bracket;

    // Every match in non-final rounds should have a nextMatchId
    for (let r = 0; r < winners.length - 1; r++) {
      for (const match of winners[r].matches) {
        expect(match.nextMatchId).not.toBeNull();
        // The referenced match should exist in the next round
        const nextMatch = winners[r + 1].matches.find((m) => m.id === match.nextMatchId);
        expect(nextMatch).toBeDefined();
      }
    }

    // Final match has nextMatchId = null
    const finalMatch = winners[winners.length - 1].matches[0];
    expect(finalMatch.nextMatchId).toBeNull();
  });

  it('bye matches in round 1 have completed: true', () => {
    const bracket = generateSingleElimBracket(['a', 'b', 'c']);
    const { winners } = bracket;

    // Round 1 bye matches (one team is null) must be auto-completed
    const r1 = winners[0].matches;
    const byeMatches = r1.filter((m) => m.team1Id === null || m.team2Id === null);
    expect(byeMatches.length).toBeGreaterThan(0);
    byeMatches.forEach((m) => {
      expect(m.completed).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// generateDoubleElimBracket
// ---------------------------------------------------------------------------

describe('generateDoubleElimBracket', () => {
  it('4 teams: winners bracket, losers bracket, and grand finals all exist', () => {
    const bracket = generateDoubleElimBracket(['a', 'b', 'c', 'd']);

    expect(bracket.winners).toBeDefined();
    expect(bracket.winners.length).toBeGreaterThan(0);

    expect(bracket.losers).toBeDefined();
    expect(bracket.losers.length).toBeGreaterThan(0);

    expect(bracket.finals).toBeDefined();
    expect(bracket.finals.matches).toHaveLength(1);
  });

  it('winners bracket structure matches single elim', () => {
    const teams = ['a', 'b', 'c', 'd'];
    const singleBracket = generateSingleElimBracket(teams);
    const doubleBracket = generateDoubleElimBracket(teams);

    // Same number of rounds
    expect(doubleBracket.winners).toHaveLength(singleBracket.winners.length);

    // Same number of matches per round
    for (let r = 0; r < singleBracket.winners.length; r++) {
      expect(doubleBracket.winners[r].matches).toHaveLength(
        singleBracket.winners[r].matches.length
      );
    }

    // Same first-round seeding
    const sR1 = singleBracket.winners[0].matches;
    const dR1 = doubleBracket.winners[0].matches;
    for (let i = 0; i < sR1.length; i++) {
      expect(dR1[i].team1Id).toBe(sR1[i].team1Id);
      expect(dR1[i].team2Id).toBe(sR1[i].team2Id);
    }
  });

  it('grand finals match has nextMatchId null', () => {
    const bracket = generateDoubleElimBracket(['a', 'b', 'c', 'd']);
    const grandFinal = bracket.finals.matches[0];
    expect(grandFinal.nextMatchId).toBeNull();
  });

  it('losers bracket has correct number of rounds', () => {
    // For 4 teams (2 WB rounds): WB round 0 has 2 matches, WB round 1 has 1.
    // LB round 1 (minor): floor(2/2) = 1 match  (WB-R1 losers play each other)
    // Then for wbr=1 (WB round 2, the WB final): drop round with 1 match.
    // dropCount = 1, not > 1 so no minor round after.
    // Total LB rounds = 2
    const bracket = generateDoubleElimBracket(['a', 'b', 'c', 'd']);
    expect(bracket.losers.length).toBeGreaterThanOrEqual(2);

    // For 8 teams we expect more LB rounds
    const bracket8 = generateDoubleElimBracket(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
    expect(bracket8.losers.length).toBeGreaterThan(bracket.losers.length);
  });

  it('WB final and LB final both wire into grand finals', () => {
    const bracket = generateDoubleElimBracket(['a', 'b', 'c', 'd']);
    const gfId = bracket.finals.matches[0].id;

    // WB final should point to grand finals
    const wbFinal = bracket.winners[bracket.winners.length - 1].matches[0];
    expect(wbFinal.nextMatchId).toBe(gfId);

    // LB final should point to grand finals
    const lbFinal = bracket.losers[bracket.losers.length - 1].matches[0];
    expect(lbFinal.nextMatchId).toBe(gfId);
  });
});

// ---------------------------------------------------------------------------
// advanceBracket
// ---------------------------------------------------------------------------

describe('advanceBracket', () => {
  it('single elim: winner placed in next match team1Id or team2Id slot', () => {
    const bracket = generateSingleElimBracket(['a', 'b', 'c', 'd']);
    const r1 = bracket.winners[0].matches;
    const r2match = bracket.winners[1].matches[0];

    // Advance first match: 'a' wins over 'b'
    advanceBracket(bracket, r1[0].id, 'a', 'b');

    // Winner should appear in the final match
    expect(r2match.team1Id === 'a' || r2match.team2Id === 'a').toBe(true);
  });

  it('match is marked completed after advancement', () => {
    const bracket = generateSingleElimBracket(['a', 'b', 'c', 'd']);
    const match = bracket.winners[0].matches[0];

    expect(match.completed).toBe(false);
    advanceBracket(bracket, match.id, 'a', 'b');
    expect(match.completed).toBe(true);
  });

  it('winner appears in next round', () => {
    const bracket = generateSingleElimBracket(['a', 'b', 'c', 'd']);
    const r1 = bracket.winners[0].matches;
    const r2 = bracket.winners[1].matches[0];

    advanceBracket(bracket, r1[0].id, 'a', 'b');
    advanceBracket(bracket, r1[1].id, 'c', 'd');

    // Both winners should be in the final
    expect(r2.team1Id).toBe('a');
    expect(r2.team2Id).toBe('c');
  });

  it('final match: nextMatchId is null, advancement still succeeds', () => {
    const bracket = generateSingleElimBracket(['a', 'b']);
    const finalMatch = bracket.winners[0].matches[0];

    expect(finalMatch.nextMatchId).toBeNull();

    // Should not throw
    const result = advanceBracket(bracket, finalMatch.id, 'a', 'b');
    expect(result).toBe(bracket);
    expect(finalMatch.completed).toBe(true);
  });

  it('returns the bracket object', () => {
    const bracket = generateSingleElimBracket(['a', 'b']);
    const result = advanceBracket(bracket, bracket.winners[0].matches[0].id, 'a', 'b');
    expect(result).toBe(bracket);
  });

  it('double elim: loser placed into losers bracket', () => {
    const bracket = generateDoubleElimBracket(['a', 'b', 'c', 'd']);
    const r1 = bracket.winners[0].matches;

    advanceBracket(bracket, r1[0].id, 'a', 'b');

    // 'b' (loser) should appear somewhere in the losers bracket
    const lbTeams = bracket.losers.flatMap((round) =>
      round.matches.flatMap((m) => [m.team1Id, m.team2Id])
    );
    expect(lbTeams).toContain('b');
  });
});

// ---------------------------------------------------------------------------
// getBracketWinner
// ---------------------------------------------------------------------------

describe('getBracketWinner', () => {
  it('single elim: final match completed returns winner team ID', () => {
    const bracket = generateSingleElimBracket(['a', 'b']);
    const finalMatch = bracket.winners[0].matches[0];

    advanceBracket(bracket, finalMatch.id, 'a', 'b');
    // Need to set scores for getMatchWinner to work correctly
    finalMatch.score1 = 10;
    finalMatch.score2 = 5;

    expect(getBracketWinner(bracket)).toBe('a');
  });

  it('single elim: final not completed returns null', () => {
    const bracket = generateSingleElimBracket(['a', 'b']);
    expect(getBracketWinner(bracket)).toBeNull();
  });

  it('single elim: multi-round bracket returns winner when fully advanced', () => {
    const bracket = generateSingleElimBracket(['a', 'b', 'c', 'd']);
    const r1 = bracket.winners[0].matches;
    const finalMatch = bracket.winners[1].matches[0];

    // Advance round 1
    r1[0].score1 = 10;
    r1[0].score2 = 5;
    advanceBracket(bracket, r1[0].id, 'a', 'b');

    r1[1].score1 = 10;
    r1[1].score2 = 5;
    advanceBracket(bracket, r1[1].id, 'c', 'd');

    // Not complete yet
    expect(getBracketWinner(bracket)).toBeNull();

    // Advance final
    finalMatch.score1 = 10;
    finalMatch.score2 = 5;
    advanceBracket(bracket, finalMatch.id, 'a', 'c');

    expect(getBracketWinner(bracket)).toBe('a');
  });

  it('double elim: grand finals completed returns winner', () => {
    const bracket = generateDoubleElimBracket(['a', 'b', 'c', 'd']);
    const gf = bracket.finals.matches[0];

    gf.team1Id = 'a';
    gf.team2Id = 'c';
    gf.score1 = 10;
    gf.score2 = 5;
    gf.completed = true;

    expect(getBracketWinner(bracket)).toBe('a');
  });

  it('double elim: incomplete returns null', () => {
    const bracket = generateDoubleElimBracket(['a', 'b', 'c', 'd']);
    expect(getBracketWinner(bracket)).toBeNull();
  });

  it('empty bracket returns null', () => {
    expect(getBracketWinner({ winners: [] })).toBeNull();
    expect(getBracketWinner({ winners: [], losers: [], finals: { matches: [] } })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// State-machine helpers
// ---------------------------------------------------------------------------

describe('getPlayableMatches', () => {
  it('returns matches with both teams that are not completed', () => {
    const bracket = generateSingleElimBracket(['a', 'b', 'c', 'd']);
    const playable = getPlayableMatches(bracket);

    // Round 1 has 2 real matches
    expect(playable).toHaveLength(2);
    playable.forEach((m) => {
      expect(m.team1Id).not.toBeNull();
      expect(m.team2Id).not.toBeNull();
      expect(m.completed).toBe(false);
    });
  });

  it('excludes bye matches', () => {
    const bracket = generateSingleElimBracket(['a', 'b', 'c']);
    const playable = getPlayableMatches(bracket);

    // Only 1 real match in R1 (other is bye), R2 has 1 team from bye
    expect(playable).toHaveLength(1);
  });

  it('returns empty when all matches completed', () => {
    const bracket = generateSingleElimBracket(['a', 'b']);
    advanceBracket(bracket, bracket.winners[0].matches[0].id, 'a', 'b');
    expect(getPlayableMatches(bracket)).toHaveLength(0);
  });
});

describe('isBracketDeadlocked', () => {
  it('returns false for fresh bracket with playable matches', () => {
    const bracket = generateSingleElimBracket(['a', 'b', 'c', 'd']);
    expect(isBracketDeadlocked(bracket)).toBe(false);
  });

  it('returns false for completed bracket', () => {
    const bracket = generateSingleElimBracket(['a', 'b']);
    const match = bracket.winners[0].matches[0];
    match.score1 = 21;
    match.score2 = 10;
    advanceBracket(bracket, match.id, 'a', 'b');
    expect(isBracketDeadlocked(bracket)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// loserNextMatchId wiring
// ---------------------------------------------------------------------------

describe('double elim loserNextMatchId wiring', () => {
  it('4 teams: all WB matches have loserNextMatchId', () => {
    const bracket = generateDoubleElimBracket(['a', 'b', 'c', 'd']);

    for (const round of bracket.winners) {
      for (const match of round.matches) {
        expect(match.loserNextMatchId).toBeDefined();
        // Should point to a real LB match
        const target = allMatches(bracket).find((m) => m.id === match.loserNextMatchId);
        expect(target).toBeDefined();
      }
    }
  });

  it('WB R0 losers map to LB R0 matches (minor round)', () => {
    const bracket = generateDoubleElimBracket(['a', 'b', 'c', 'd']);
    const wbR0 = bracket.winners[0].matches;
    const lbR0 = bracket.losers[0].matches;

    // Both WB R0 matches should point to the same LB R0 match (paired)
    expect(wbR0[0].loserNextMatchId).toBe(lbR0[0].id);
    expect(wbR0[1].loserNextMatchId).toBe(lbR0[0].id);
  });

  it('WB R1 losers map to LB drop round', () => {
    const bracket = generateDoubleElimBracket(['a', 'b', 'c', 'd']);
    const wbR1 = bracket.winners[1].matches;
    const lbR1 = bracket.losers[1].matches;

    expect(wbR1[0].loserNextMatchId).toBe(lbR1[0].id);
  });
});

// ---------------------------------------------------------------------------
// Full tournament simulations — deadlock-free guarantee
// ---------------------------------------------------------------------------

/**
 * Simulate an entire bracket tournament.  The team with the lower index
 * (higher seed) always wins.  Returns the completed bracket.
 */
function simulateBracket(bracket) {
  const MAX_ITERATIONS = 200;
  let iterations = 0;

  while (iterations++ < MAX_ITERATIONS) {
    const playable = getPlayableMatches(bracket);
    if (playable.length === 0) break;

    const match = playable[0];
    match.score1 = 21;
    match.score2 = 10;
    advanceBracket(bracket, match.id, match.team1Id, match.team2Id);
  }

  return bracket;
}

function teamIds(n) {
  return Array.from({ length: n }, (_, i) => `t${i + 1}`);
}

describe('single elimination: full simulation (2–16 teams)', () => {
  for (let n = 2; n <= 16; n++) {
    it(`${n} teams: completes without deadlock`, () => {
      const bracket = generateSingleElimBracket(teamIds(n));
      simulateBracket(bracket);

      expect(isBracketDeadlocked(bracket)).toBe(false);
      expect(getBracketWinner(bracket)).not.toBeNull();
      expect(getBracketWinner(bracket)).toBe('t1'); // top seed always wins
    });
  }
});

describe('double elimination: full simulation (2–16 teams)', () => {
  for (let n = 2; n <= 16; n++) {
    it(`${n} teams: completes without deadlock`, () => {
      const bracket = generateDoubleElimBracket(teamIds(n));
      simulateBracket(bracket);

      expect(isBracketDeadlocked(bracket)).toBe(false);
      expect(getBracketWinner(bracket)).not.toBeNull();
    });
  }
});

describe('double elimination: 3-team regression (original deadlock)', () => {
  it('3 teams: LB R0 auto-advances as bye after single WB R0 loser placed', () => {
    const bracket = generateDoubleElimBracket(['A', 'B', 'C']);

    // WB R0 has 1 bye (A advances) and 1 real match (B vs C)
    const wbR0 = bracket.winners[0].matches;
    const realMatch = wbR0.find((m) => m.team1Id !== null && m.team2Id !== null);
    expect(realMatch).toBeDefined();

    // Play B vs C → B wins, C goes to LB
    realMatch.score1 = 21;
    realMatch.score2 = 10;
    advanceBracket(bracket, realMatch.id, realMatch.team1Id, realMatch.team2Id);

    // LB R0 should auto-advance C (bye — no second team coming)
    const lbR0Match = bracket.losers[0].matches[0];
    expect(lbR0Match.completed).toBe(true);
    expect(lbR0Match.team1Id || lbR0Match.team2Id).toBe('C');

    // WB R1 (A vs B) should be playable
    expect(getPlayableMatches(bracket).length).toBeGreaterThanOrEqual(1);

    // Should NOT be deadlocked
    expect(isBracketDeadlocked(bracket)).toBe(false);
  });

  it('3 teams: full tournament completes through grand finals', () => {
    const bracket = generateDoubleElimBracket(['A', 'B', 'C']);
    simulateBracket(bracket);

    expect(isBracketDeadlocked(bracket)).toBe(false);
    expect(getBracketWinner(bracket)).not.toBeNull();

    // Grand finals should be completed
    expect(bracket.finals.matches[0].completed).toBe(true);
  });
});

describe('double elimination: 5-team regression (cascading byes)', () => {
  it('5 teams: WB R0 has 3 byes, LB R0 handles cascading auto-advances', () => {
    const bracket = generateDoubleElimBracket(teamIds(5));

    // WB R0 should have 3 byes and 1 real match
    const wbR0 = bracket.winners[0].matches;
    const byes = wbR0.filter((m) => m.team1Id === null || m.team2Id === null);
    const real = wbR0.filter((m) => m.team1Id !== null && m.team2Id !== null);
    expect(byes).toHaveLength(3);
    expect(real).toHaveLength(1);

    // Should not be deadlocked at any point during simulation
    simulateBracket(bracket);
    expect(isBracketDeadlocked(bracket)).toBe(false);
    expect(getBracketWinner(bracket)).not.toBeNull();
  });
});

describe('double elimination: lower seed can win via losers bracket', () => {
  it('4 teams: team2 wins through losers bracket', () => {
    const bracket = generateDoubleElimBracket(['A', 'B', 'C', 'D']);
    const wbR0 = bracket.winners[0].matches;

    // R0: A beats D, C beats B → B goes to LB
    wbR0[0].score1 = 21;
    wbR0[0].score2 = 10;
    advanceBracket(bracket, wbR0[0].id, 'A', 'D');

    wbR0[1].score1 = 10;
    wbR0[1].score2 = 21;
    advanceBracket(bracket, wbR0[1].id, 'C', 'B');

    // WB Final: A vs C
    const wbFinal = bracket.winners[1].matches[0];
    expect(wbFinal.team1Id).toBe('A');
    expect(wbFinal.team2Id).toBe('C');

    // C beats A → A drops to LB
    wbFinal.score1 = 10;
    wbFinal.score2 = 21;
    advanceBracket(bracket, wbFinal.id, 'C', 'A');

    // LB R0: D vs B
    const lbR0 = bracket.losers[0].matches[0];
    expect(lbR0.team1Id).toBe('D');
    expect(lbR0.team2Id).toBe('B');

    // B beats D
    lbR0.score1 = 10;
    lbR0.score2 = 21;
    advanceBracket(bracket, lbR0.id, 'B', 'D');

    // LB R1: B vs A (drop round)
    const lbR1 = bracket.losers[1].matches[0];
    expect(lbR1.team1Id === 'B' || lbR1.team2Id === 'B').toBe(true);
    expect(lbR1.team1Id === 'A' || lbR1.team2Id === 'A').toBe(true);

    // B beats A → B goes to grand finals
    lbR1.score1 = lbR1.team1Id === 'B' ? 21 : 10;
    lbR1.score2 = lbR1.team2Id === 'B' ? 21 : 10;
    advanceBracket(bracket, lbR1.id, 'B', 'A');

    // Grand finals: C vs B
    const gf = bracket.finals.matches[0];
    expect(gf.team1Id === 'C' || gf.team2Id === 'C').toBe(true);
    expect(gf.team1Id === 'B' || gf.team2Id === 'B').toBe(true);

    // B wins grand finals
    gf.score1 = gf.team1Id === 'B' ? 21 : 10;
    gf.score2 = gf.team2Id === 'B' ? 21 : 10;
    advanceBracket(bracket, gf.id, 'B', 'C');

    expect(getBracketWinner(bracket)).toBe('B');
  });
});
