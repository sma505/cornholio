/**
 * Singles tournament simulation tests.
 *
 * In singles mode, each player becomes a 1-player "team" via
 * createTeamsFromPlayers(). This means N players → N entries in the
 * bracket/round-robin. These tests verify that all 4 tournament formats
 * complete without deadlocks for typical singles player counts.
 */
import { describe, it, expect } from 'vitest';
import {
  generateRoundRobinSchedule,
  assignGroups,
  calculateStandings,
} from '../src/lib/utils/roundrobin.js';
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

/**
 * Simulate the singles flow: N players → N 1-player teams → team IDs.
 * Mirrors createTeamsFromPlayers() from the store.
 */
function singlesTeamIds(playerNames) {
  return playerNames.map((_, i) => `player-${i + 1}`);
}

function playerNames(n) {
  return Array.from({ length: n }, (_, i) => `Player ${i + 1}`);
}

/** Simulate a bracket to completion. team1 always wins. */
function simulateBracket(bracket) {
  let iterations = 0;
  while (iterations++ < 200) {
    const playable = getPlayableMatches(bracket);
    if (playable.length === 0) break;
    const match = playable[0];
    match.score1 = 21;
    match.score2 = 10;
    advanceBracket(bracket, match.id, match.team1Id, match.team2Id);
  }
  return bracket;
}

/** Simulate a full group+playoff tournament. */
function simulateGroupPlayoff(teamIds, numGroups, advancePerGroup) {
  const groups = assignGroups(teamIds, numGroups);
  const allGroupMatches = [];
  for (const group of groups) {
    for (const round of generateRoundRobinSchedule(group.teamIds)) {
      for (const match of round.matches) {
        allGroupMatches.push({ ...match, round: round.round, groupId: group.id });
      }
    }
  }
  for (const m of allGroupMatches) {
    m.score1 = 21;
    m.score2 = 10;
    m.completed = true;
  }

  const advancingTeams = [];
  for (const group of groups) {
    const gm = allGroupMatches.filter((m) => m.groupId === group.id);
    const standings = calculateStandings(gm, group.teamIds);
    advancingTeams.push(...standings.slice(0, advancePerGroup).map((s) => s.teamId));
  }

  if (advancingTeams.length < 2) {
    return { winner: null, bracket: null, advancingTeams };
  }

  const bracket = generateSingleElimBracket(advancingTeams);
  simulateBracket(bracket);
  return {
    winner: getBracketWinner(bracket),
    bracket,
    advancingTeams,
  };
}

// ---------------------------------------------------------------------------
// Singles — Round Robin (2–16 players)
// ---------------------------------------------------------------------------

describe('singles round robin: full simulation (2–16 players)', () => {
  for (let n = 2; n <= 16; n++) {
    it(`${n} players: all play each other, standings complete`, () => {
      const teamIds = singlesTeamIds(playerNames(n));
      const schedule = generateRoundRobinSchedule(teamIds);
      const matches = schedule.flatMap((r) => r.matches);

      // N players = N*(N-1)/2 matches
      expect(matches).toHaveLength((n * (n - 1)) / 2);

      // Simulate all matches
      for (const m of matches) {
        m.score1 = 21;
        m.score2 = 10;
        m.completed = true;
      }

      const standings = calculateStandings(matches, teamIds);
      expect(standings).toHaveLength(n);
      for (const s of standings) {
        expect(s.wins + s.losses + s.draws).toBe(n - 1);
      }
    });
  }
});

// ---------------------------------------------------------------------------
// Singles — Single Elimination (2–16 players)
// ---------------------------------------------------------------------------

describe('singles single elimination: full simulation (2–16 players)', () => {
  for (let n = 2; n <= 16; n++) {
    it(`${n} players: completes without deadlock`, () => {
      const teamIds = singlesTeamIds(playerNames(n));
      const bracket = generateSingleElimBracket(teamIds);
      simulateBracket(bracket);

      expect(isBracketDeadlocked(bracket)).toBe(false);
      expect(getBracketWinner(bracket)).not.toBeNull();
    });
  }
});

// ---------------------------------------------------------------------------
// Singles — Double Elimination (2–16 players)
// ---------------------------------------------------------------------------

describe('singles double elimination: full simulation (2–16 players)', () => {
  for (let n = 2; n <= 16; n++) {
    it(`${n} players: completes without deadlock`, () => {
      const teamIds = singlesTeamIds(playerNames(n));
      const bracket = generateDoubleElimBracket(teamIds);
      simulateBracket(bracket);

      expect(isBracketDeadlocked(bracket)).toBe(false);
      expect(getBracketWinner(bracket)).not.toBeNull();
      expect(bracket.finals.matches[0].completed).toBe(true);
    });
  }
});

// ---------------------------------------------------------------------------
// Singles — Group + Playoff
// ---------------------------------------------------------------------------

describe('singles group + playoff: full simulation', () => {
  const configs = [
    { players: 4, groups: 2, advance: 1 },   // 2 groups of 2, top 1 → 2-player bracket
    { players: 5, groups: 2, advance: 2 },   // uneven groups (3+2), top 2 → 4-player bracket
    { players: 6, groups: 2, advance: 2 },   // 2 groups of 3, top 2 → 4-player bracket
    { players: 6, groups: 3, advance: 1 },   // 3 groups of 2, top 1 → 3-player bracket (bye!)
    { players: 7, groups: 2, advance: 2 },   // uneven (4+3), top 2 → 4-player bracket
    { players: 8, groups: 2, advance: 2 },   // 2 groups of 4, top 2 → 4-player bracket
    { players: 8, groups: 4, advance: 1 },   // 4 groups of 2, top 1 → 4-player bracket
    { players: 9, groups: 3, advance: 2 },   // 3 groups of 3, top 2 → 6-player bracket (byes!)
    { players: 10, groups: 2, advance: 3 },  // 2 groups of 5, top 3 → 6-player bracket (byes!)
    { players: 12, groups: 3, advance: 2 },  // 3 groups of 4, top 2 → 6-player bracket
    { players: 12, groups: 4, advance: 2 },  // 4 groups of 3, top 2 → 8-player bracket
    { players: 16, groups: 4, advance: 2 },  // 4 groups of 4, top 2 → 8-player bracket
  ];

  for (const cfg of configs) {
    it(`${cfg.players} players, ${cfg.groups} groups, advance ${cfg.advance}: completes without deadlock`, () => {
      const teamIds = singlesTeamIds(playerNames(cfg.players));
      const result = simulateGroupPlayoff(teamIds, cfg.groups, cfg.advance);

      const expectedAdvancing = cfg.groups * cfg.advance;
      expect(result.advancingTeams).toHaveLength(expectedAdvancing);
      expect(new Set(result.advancingTeams).size).toBe(expectedAdvancing);

      if (expectedAdvancing >= 2) {
        expect(isBracketDeadlocked(result.bracket)).toBe(false);
        expect(result.winner).not.toBeNull();
        expect(result.advancingTeams).toContain(result.winner);
      }
    });
  }
});

// ---------------------------------------------------------------------------
// Singles-specific edge cases
// ---------------------------------------------------------------------------

describe('singles-specific edge cases', () => {
  it('3 players double elim (original bug scenario in singles mode)', () => {
    // 3 players = 3 entries in double-elim (same structure as 3 teams)
    const teamIds = singlesTeamIds(playerNames(3));
    const bracket = generateDoubleElimBracket(teamIds);
    simulateBracket(bracket);

    expect(isBracketDeadlocked(bracket)).toBe(false);
    expect(getBracketWinner(bracket)).not.toBeNull();
  });

  it('6 players singles double elim (user reported scenario equivalent)', () => {
    // 6 players in singles = 6 entries (not 3 teams like in teams mode)
    const teamIds = singlesTeamIds(playerNames(6));
    const bracket = generateDoubleElimBracket(teamIds);

    // WB R0 should have byes (nextPowerOf2(6) = 8, so 2 byes)
    const wbR0 = bracket.winners[0].matches;
    const byes = wbR0.filter((m) => m.team1Id === null || m.team2Id === null);
    expect(byes).toHaveLength(2);

    simulateBracket(bracket);
    expect(isBracketDeadlocked(bracket)).toBe(false);
    expect(getBracketWinner(bracket)).not.toBeNull();
  });

  it('5 players singles group+playoff with odd bracket (5→3 groups→3 advance)', () => {
    const teamIds = singlesTeamIds(playerNames(5));
    // 5 players in 3 groups: groups of 2, 2, 1
    // Advance 1 per group → 3-player bracket (byes)
    const result = simulateGroupPlayoff(teamIds, 3, 1);

    expect(result.advancingTeams).toHaveLength(3);
    expect(isBracketDeadlocked(result.bracket)).toBe(false);
    expect(result.winner).not.toBeNull();
  });

  it('2 players singles is the minimal viable tournament for all formats', () => {
    const teamIds = singlesTeamIds(playerNames(2));

    // Round Robin
    const schedule = generateRoundRobinSchedule(teamIds);
    expect(schedule.flatMap((r) => r.matches)).toHaveLength(1);

    // Single Elim
    const se = generateSingleElimBracket(teamIds);
    simulateBracket(se);
    expect(getBracketWinner(se)).not.toBeNull();

    // Double Elim
    const de = generateDoubleElimBracket(teamIds);
    simulateBracket(de);
    expect(getBracketWinner(de)).not.toBeNull();
  });
});
