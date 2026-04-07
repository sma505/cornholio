import { describe, it, expect } from 'vitest';
import {
  generateRoundRobinSchedule,
  assignGroups,
  calculateStandings,
} from '../src/lib/utils/roundrobin.js';
import {
  generateSingleElimBracket,
  advanceBracket,
  getBracketWinner,
  getPlayableMatches,
  isBracketDeadlocked,
} from '../src/lib/utils/bracket.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ids(n) {
  return Array.from({ length: n }, (_, i) => `team-${i + 1}`);
}

/** Flatten all matches from every round into a single array. */
function flatMatches(schedule) {
  return schedule.flatMap((r) => r.matches);
}

// ---------------------------------------------------------------------------
// generateRoundRobinSchedule
// ---------------------------------------------------------------------------

describe('generateRoundRobinSchedule', () => {
  it('returns an empty schedule for 0 teams', () => {
    expect(generateRoundRobinSchedule([])).toEqual([]);
  });

  it('returns an empty schedule for 1 team', () => {
    expect(generateRoundRobinSchedule(['solo'])).toEqual([]);
  });

  it('produces 1 match in 1 round for 2 teams', () => {
    const schedule = generateRoundRobinSchedule(ids(2));
    expect(schedule).toHaveLength(1);
    expect(schedule[0].round).toBe(1);
    expect(schedule[0].matches).toHaveLength(1);
  });

  it('handles 3 teams (odd) — 3 matches, no self-matches, no null teams', () => {
    const schedule = generateRoundRobinSchedule(ids(3));
    const matches = flatMatches(schedule);

    expect(matches).toHaveLength(3);

    for (const m of matches) {
      expect(m.team1Id).not.toBeNull();
      expect(m.team2Id).not.toBeNull();
      expect(m.team1Id).not.toBe(m.team2Id);
    }
  });

  it('produces 6 matches across 3 rounds for 4 teams', () => {
    const schedule = generateRoundRobinSchedule(ids(4));
    const matches = flatMatches(schedule);

    expect(schedule).toHaveLength(3);
    expect(matches).toHaveLength(6);
  });

  it('produces 10 matches with no self-matches for 5 teams', () => {
    const schedule = generateRoundRobinSchedule(ids(5));
    const matches = flatMatches(schedule);

    expect(matches).toHaveLength(10);

    for (const m of matches) {
      expect(m.team1Id).not.toBe(m.team2Id);
    }
  });

  it('produces 15 matches for 6 teams', () => {
    const matches = flatMatches(generateRoundRobinSchedule(ids(6)));
    expect(matches).toHaveLength(15);
  });

  it('every team plays every other team exactly once', () => {
    const teamIds = ids(6);
    const matches = flatMatches(generateRoundRobinSchedule(teamIds));

    const seen = new Set();
    for (const m of matches) {
      const key = [m.team1Id, m.team2Id].sort().join('|');
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }

    // Total unique matchups for n teams = n*(n-1)/2
    expect(seen.size).toBe((6 * 5) / 2);
  });

  it('has no duplicate matchups', () => {
    const matches = flatMatches(generateRoundRobinSchedule(ids(8)));
    const keys = matches.map((m) => [m.team1Id, m.team2Id].sort().join('|'));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('all matches have unique IDs, null scores, and completed === false', () => {
    const matches = flatMatches(generateRoundRobinSchedule(ids(5)));
    const idSet = new Set();

    for (const m of matches) {
      expect(m.id).toBeDefined();
      expect(typeof m.id).toBe('string');
      expect(idSet.has(m.id)).toBe(false);
      idSet.add(m.id);

      expect(m.score1).toBeNull();
      expect(m.score2).toBeNull();
      expect(m.completed).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// assignGroups
// ---------------------------------------------------------------------------

describe('assignGroups', () => {
  it('distributes 8 teams into 2 groups of 4 with snake draft', () => {
    const teams = ids(8);
    const groups = assignGroups(teams, 2);

    expect(groups).toHaveLength(2);
    expect(groups[0].teamIds).toHaveLength(4);
    expect(groups[1].teamIds).toHaveLength(4);

    // Snake draft: A gets 1,4,5,8 — B gets 2,3,6,7
    expect(groups[0].teamIds).toEqual(['team-1', 'team-4', 'team-5', 'team-8']);
    expect(groups[1].teamIds).toEqual(['team-2', 'team-3', 'team-6', 'team-7']);
  });

  it('distributes 6 teams into 3 groups of 2', () => {
    const groups = assignGroups(ids(6), 3);

    expect(groups).toHaveLength(3);
    for (const g of groups) {
      expect(g.teamIds).toHaveLength(2);
    }
  });

  it('handles uneven split — 7 teams into 2 groups (4 and 3)', () => {
    const groups = assignGroups(ids(7), 2);

    expect(groups).toHaveLength(2);

    const sizes = groups.map((g) => g.teamIds.length).sort();
    expect(sizes).toEqual([3, 4]);
  });

  it('handles 4 teams into 4 groups — 1 per group', () => {
    const groups = assignGroups(ids(4), 4);

    expect(groups).toHaveLength(4);
    for (const g of groups) {
      expect(g.teamIds).toHaveLength(1);
    }
  });

  it('assigns correct group names: "Group A", "Group B", etc.', () => {
    const groups = assignGroups(ids(8), 4);

    expect(groups[0].name).toBe('Group A');
    expect(groups[1].name).toBe('Group B');
    expect(groups[2].name).toBe('Group C');
    expect(groups[3].name).toBe('Group D');
  });
});

// ---------------------------------------------------------------------------
// calculateStandings
// ---------------------------------------------------------------------------

describe('calculateStandings', () => {
  const teamIds = ['A', 'B', 'C'];

  it('returns all zeros when no matches are completed', () => {
    const matches = [
      { team1Id: 'A', team2Id: 'B', score1: null, score2: null, completed: false },
    ];

    const standings = calculateStandings(matches, teamIds);

    for (const s of standings) {
      expect(s.wins).toBe(0);
      expect(s.losses).toBe(0);
      expect(s.draws).toBe(0);
      expect(s.points).toBe(0);
      expect(s.pointsFor).toBe(0);
      expect(s.pointsAgainst).toBe(0);
      expect(s.differential).toBe(0);
    }
  });

  it('tracks basic wins and losses', () => {
    const matches = [
      { team1Id: 'A', team2Id: 'B', score1: 21, score2: 15, completed: true },
    ];

    const standings = calculateStandings(matches, teamIds);
    const a = standings.find((s) => s.teamId === 'A');
    const b = standings.find((s) => s.teamId === 'B');

    expect(a.wins).toBe(1);
    expect(a.losses).toBe(0);
    expect(b.wins).toBe(0);
    expect(b.losses).toBe(1);
  });

  it('increments draws when score1 === score2', () => {
    const matches = [
      { team1Id: 'A', team2Id: 'B', score1: 10, score2: 10, completed: true },
    ];

    const standings = calculateStandings(matches, teamIds);
    const a = standings.find((s) => s.teamId === 'A');
    const b = standings.find((s) => s.teamId === 'B');

    expect(a.draws).toBe(1);
    expect(b.draws).toBe(1);
    expect(a.wins).toBe(0);
    expect(a.losses).toBe(0);
  });

  it('awards 3 points per win and 1 per draw', () => {
    const matches = [
      { team1Id: 'A', team2Id: 'B', score1: 21, score2: 15, completed: true },
      { team1Id: 'A', team2Id: 'C', score1: 10, score2: 10, completed: true },
    ];

    const standings = calculateStandings(matches, teamIds);
    const a = standings.find((s) => s.teamId === 'A');
    const c = standings.find((s) => s.teamId === 'C');

    // A: 1 win (3) + 1 draw (1) = 4
    expect(a.points).toBe(4);
    // C: 1 draw (1) = 1
    expect(c.points).toBe(1);
  });

  it('calculates PF, PA, and differential correctly', () => {
    const matches = [
      { team1Id: 'A', team2Id: 'B', score1: 21, score2: 15, completed: true },
      { team1Id: 'A', team2Id: 'C', score1: 18, score2: 12, completed: true },
    ];

    const standings = calculateStandings(matches, teamIds);
    const a = standings.find((s) => s.teamId === 'A');

    expect(a.pointsFor).toBe(21 + 18);
    expect(a.pointsAgainst).toBe(15 + 12);
    expect(a.differential).toBe(39 - 27);
  });

  it('sorts by points, then wins, then differential, then pointsFor', () => {
    // Craft a scenario where tiebreakers matter:
    // A: 1 win (3 pts), PF=21, PA=10 → diff=+11
    // B: 1 win (3 pts), PF=21, PA=15 → diff=+6
    // C: 0 wins (0 pts)
    const matches = [
      { team1Id: 'A', team2Id: 'C', score1: 21, score2: 10, completed: true },
      { team1Id: 'B', team2Id: 'C', score1: 21, score2: 15, completed: true },
    ];

    const standings = calculateStandings(matches, teamIds);

    // Same points (3) and wins (1), so sorted by differential: A (+11) > B (+6)
    expect(standings[0].teamId).toBe('A');
    expect(standings[1].teamId).toBe('B');
    expect(standings[2].teamId).toBe('C');
  });

  it('sorts by pointsFor when points, wins, and differential are tied', () => {
    // A beats C 30-20 → diff=+10, PF=30
    // B beats C 25-15 → diff=+10, PF=25
    const matches = [
      { team1Id: 'A', team2Id: 'C', score1: 30, score2: 20, completed: true },
      { team1Id: 'B', team2Id: 'C', score1: 25, score2: 15, completed: true },
    ];

    const standings = calculateStandings(matches, teamIds);

    // Same points, wins, and differential — A has higher PF
    expect(standings[0].teamId).toBe('A');
    expect(standings[1].teamId).toBe('B');
  });

  it('filters out incomplete matches', () => {
    const matches = [
      { team1Id: 'A', team2Id: 'B', score1: 21, score2: 15, completed: true },
      { team1Id: 'A', team2Id: 'C', score1: null, score2: null, completed: false },
    ];

    const standings = calculateStandings(matches, teamIds);
    const a = standings.find((s) => s.teamId === 'A');
    const c = standings.find((s) => s.teamId === 'C');

    expect(a.wins).toBe(1);
    expect(a.pointsFor).toBe(21);
    expect(c.wins).toBe(0);
    expect(c.pointsFor).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Full Round Robin simulation (2–16 teams)
// ---------------------------------------------------------------------------

/**
 * Simulate all matches in a round-robin schedule.
 * team1 always wins with score 21-10 (deterministic, higher seed wins).
 */
function simulateRR(schedule, teamIds) {
  const matches = flatMatches(schedule);
  for (const m of matches) {
    m.score1 = 21;
    m.score2 = 10;
    m.completed = true;
  }
  return { matches, standings: calculateStandings(matches, teamIds) };
}

describe('round robin: full simulation (2–16 teams)', () => {
  for (let n = 2; n <= 16; n++) {
    it(`${n} teams: correct match count and all complete`, () => {
      const teamIds = ids(n);
      const schedule = generateRoundRobinSchedule(teamIds);
      const matches = flatMatches(schedule);

      // n*(n-1)/2 total unique matchups
      const expectedMatches = (n * (n - 1)) / 2;
      expect(matches).toHaveLength(expectedMatches);

      // Every team plays every other team exactly once
      const seen = new Set();
      for (const m of matches) {
        expect(m.team1Id).not.toBeNull();
        expect(m.team2Id).not.toBeNull();
        expect(m.team1Id).not.toBe(m.team2Id);
        const key = [m.team1Id, m.team2Id].sort().join('|');
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
      expect(seen.size).toBe(expectedMatches);
    });

    it(`${n} teams: standings complete after all matches`, () => {
      const teamIds = ids(n);
      const schedule = generateRoundRobinSchedule(teamIds);
      const { standings } = simulateRR(schedule, teamIds);

      expect(standings).toHaveLength(n);

      // Every team should have exactly n-1 games (wins + losses + draws)
      for (const s of standings) {
        expect(s.wins + s.losses + s.draws).toBe(n - 1);
      }

      // Total wins must equal total losses (no draws since team1 always wins)
      const totalWins = standings.reduce((sum, s) => sum + s.wins, 0);
      const totalLosses = standings.reduce((sum, s) => sum + s.losses, 0);
      expect(totalWins).toBe(totalLosses);
    });
  }
});

describe('round robin: draw handling', () => {
  it('draws are counted correctly in standings', () => {
    const teamIds = ids(4);
    const schedule = generateRoundRobinSchedule(teamIds);
    const matches = flatMatches(schedule);

    // Make all matches draws
    for (const m of matches) {
      m.score1 = 10;
      m.score2 = 10;
      m.completed = true;
    }

    const standings = calculateStandings(matches, teamIds);
    for (const s of standings) {
      expect(s.wins).toBe(0);
      expect(s.losses).toBe(0);
      expect(s.draws).toBe(3); // plays 3 other teams, all draws
      expect(s.points).toBe(3); // 3 draws * 1 point each
      expect(s.differential).toBe(0);
    }
  });

  it('mixed results with draws sort correctly', () => {
    const teamIds = ['A', 'B', 'C'];
    const matches = [
      { team1Id: 'A', team2Id: 'B', score1: 21, score2: 10, completed: true }, // A wins
      { team1Id: 'A', team2Id: 'C', score1: 15, score2: 15, completed: true }, // draw
      { team1Id: 'B', team2Id: 'C', score1: 21, score2: 10, completed: true }, // B wins
    ];
    // A: 1W 0L 1D = 4pts, PF=36 PA=25 diff=+11
    // B: 1W 1L 0D = 3pts, PF=31 PA=31 diff=0
    // C: 0W 1L 1D = 1pt,  PF=25 PA=36 diff=-11

    const standings = calculateStandings(matches, teamIds);
    expect(standings[0].teamId).toBe('A');
    expect(standings[1].teamId).toBe('B');
    expect(standings[2].teamId).toBe('C');
  });
});

// ---------------------------------------------------------------------------
// Group + Playoff full simulation
// ---------------------------------------------------------------------------

/**
 * Simulate a complete group+playoff tournament.
 * Replicates the flow in GamePlay.svelte: groups → RR per group → standings
 * → top N advance → single-elim bracket → winner.
 */
function simulateGroupPlayoff(teamIds, numGroups, advancePerGroup) {
  // Phase 1: Assign groups
  const groups = assignGroups(teamIds, numGroups);

  // Phase 2: Generate and play group-stage matches
  const allGroupMatches = [];
  for (const group of groups) {
    const schedule = generateRoundRobinSchedule(group.teamIds);
    for (const round of schedule) {
      for (const match of round.matches) {
        allGroupMatches.push({ ...match, round: round.round, groupId: group.id });
      }
    }
  }

  // Play all group matches (team1 always wins)
  for (const m of allGroupMatches) {
    m.score1 = 21;
    m.score2 = 10;
    m.completed = true;
  }

  // Phase 3: Determine advancing teams from each group
  const advancingTeams = [];
  for (const group of groups) {
    const groupMatches = allGroupMatches.filter((m) => m.groupId === group.id);
    const standings = calculateStandings(groupMatches, group.teamIds);
    advancingTeams.push(
      ...standings.slice(0, advancePerGroup).map((s) => s.teamId)
    );
  }

  // Phase 4: Single-elim playoff bracket
  if (advancingTeams.length < 2) {
    return { groups, allGroupMatches, advancingTeams, bracket: null, winner: null };
  }

  const bracket = generateSingleElimBracket(advancingTeams);

  // Simulate playoff bracket
  let iterations = 0;
  while (iterations++ < 100) {
    const playable = getPlayableMatches(bracket);
    if (playable.length === 0) break;
    const match = playable[0];
    match.score1 = 21;
    match.score2 = 10;
    advanceBracket(bracket, match.id, match.team1Id, match.team2Id);
  }

  return {
    groups,
    allGroupMatches,
    advancingTeams,
    bracket,
    winner: getBracketWinner(bracket),
  };
}

describe('group + playoff: full simulation', () => {
  // Standard configs: numGroups, advancePerGroup
  const configs = [
    { teams: 4, groups: 2, advance: 1 },   // 2 groups of 2, top 1 → 2-team bracket
    { teams: 4, groups: 2, advance: 2 },   // 2 groups of 2, top 2 → 4-team bracket
    { teams: 6, groups: 2, advance: 2 },   // 2 groups of 3, top 2 → 4-team bracket
    { teams: 6, groups: 3, advance: 1 },   // 3 groups of 2, top 1 → 3-team bracket
    { teams: 8, groups: 2, advance: 2 },   // 2 groups of 4, top 2 → 4-team bracket
    { teams: 8, groups: 2, advance: 4 },   // 2 groups of 4, all advance → 8-team bracket
    { teams: 8, groups: 4, advance: 1 },   // 4 groups of 2, top 1 → 4-team bracket
    { teams: 8, groups: 4, advance: 2 },   // 4 groups of 2, top 2 → 8-team bracket
    { teams: 10, groups: 2, advance: 2 },  // 2 groups of 5, top 2 → 4-team bracket
    { teams: 12, groups: 3, advance: 2 },  // 3 groups of 4, top 2 → 6-team bracket
    { teams: 12, groups: 4, advance: 2 },  // 4 groups of 3, top 2 → 8-team bracket
    { teams: 16, groups: 4, advance: 2 },  // 4 groups of 4, top 2 → 8-team bracket
    { teams: 16, groups: 4, advance: 4 },  // 4 groups of 4, all → 16-team bracket
  ];

  for (const cfg of configs) {
    it(`${cfg.teams} teams, ${cfg.groups} groups, advance ${cfg.advance}: completes without deadlock`, () => {
      const teamIds = ids(cfg.teams);
      const result = simulateGroupPlayoff(teamIds, cfg.groups, cfg.advance);

      // Groups generated correctly
      expect(result.groups).toHaveLength(cfg.groups);

      // All group matches played
      expect(result.allGroupMatches.every((m) => m.completed)).toBe(true);

      // Correct number of teams advance
      const expectedAdvancing = Math.min(
        cfg.groups * cfg.advance,
        cfg.teams
      );
      expect(result.advancingTeams).toHaveLength(expectedAdvancing);

      // No duplicate advancing teams
      expect(new Set(result.advancingTeams).size).toBe(expectedAdvancing);

      // Bracket completes with a winner
      if (expectedAdvancing >= 2) {
        expect(result.bracket).not.toBeNull();
        expect(isBracketDeadlocked(result.bracket)).toBe(false);
        expect(result.winner).not.toBeNull();
        // Winner should be one of the advancing teams
        expect(result.advancingTeams).toContain(result.winner);
      }
    });
  }
});

describe('group + playoff: edge cases', () => {
  it('odd advancing teams (3 groups, advance 1 = 3-team bracket)', () => {
    const result = simulateGroupPlayoff(ids(6), 3, 1);
    expect(result.advancingTeams).toHaveLength(3);
    expect(isBracketDeadlocked(result.bracket)).toBe(false);
    expect(result.winner).not.toBeNull();
  });

  it('uneven group sizes (7 teams, 2 groups)', () => {
    const result = simulateGroupPlayoff(ids(7), 2, 2);
    const sizes = result.groups.map((g) => g.teamIds.length).sort();
    expect(sizes).toEqual([3, 4]);
    expect(result.advancingTeams).toHaveLength(4);
    expect(isBracketDeadlocked(result.bracket)).toBe(false);
    expect(result.winner).not.toBeNull();
  });

  it('uneven group sizes (5 teams, 2 groups)', () => {
    const result = simulateGroupPlayoff(ids(5), 2, 2);
    const sizes = result.groups.map((g) => g.teamIds.length).sort();
    expect(sizes).toEqual([2, 3]);
    expect(result.advancingTeams).toHaveLength(4);
    expect(result.winner).not.toBeNull();
  });

  it('large tournament (16 teams, 4 groups, advance 3 = 12-team bracket)', () => {
    const result = simulateGroupPlayoff(ids(16), 4, 3);
    expect(result.advancingTeams).toHaveLength(12);
    expect(isBracketDeadlocked(result.bracket)).toBe(false);
    expect(result.winner).not.toBeNull();
  });

  it('group standings determine correct advancing teams', () => {
    // 4 teams, 2 groups of 2, advance top 1 per group
    const groups = assignGroups(ids(4), 2);
    // Group A: team-1, team-4 → team-1 should advance (higher seed)
    // Group B: team-2, team-3 → team-2 should advance

    const allMatches = [];
    for (const group of groups) {
      for (const round of generateRoundRobinSchedule(group.teamIds)) {
        for (const match of round.matches) {
          allMatches.push({ ...match, round: round.round, groupId: group.id });
        }
      }
    }

    // team1 always wins (score1 > score2)
    for (const m of allMatches) {
      m.score1 = 21;
      m.score2 = 10;
      m.completed = true;
    }

    const advancing = [];
    for (const group of groups) {
      const gm = allMatches.filter((m) => m.groupId === group.id);
      const standings = calculateStandings(gm, group.teamIds);
      advancing.push(standings[0].teamId);
    }

    // Group A: team-1 beats team-4 → team-1 advances
    // Group B: team-2 beats team-3 → team-2 advances
    expect(advancing).toContain('team-1');
    expect(advancing).toContain('team-2');
    expect(advancing).not.toContain('team-3');
    expect(advancing).not.toContain('team-4');
  });
});
