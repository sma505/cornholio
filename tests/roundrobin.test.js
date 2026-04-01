import { describe, it, expect } from 'vitest';
import {
  generateRoundRobinSchedule,
  assignGroups,
  calculateStandings,
} from '../src/lib/utils/roundrobin.js';

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
