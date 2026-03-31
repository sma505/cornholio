/**
 * Round-robin scheduling and group-stage utilities.
 */

/**
 * Generate a full round-robin schedule using the circle (polygon) method.
 *
 * One team is fixed in place while the remaining teams rotate through each
 * round.  For an odd number of teams a BYE (null) is added; bye matches are
 * filtered out of the returned schedule.
 *
 * @param {string[]} teamIds
 * @returns {Array<{ round: number, matches: Array<{ id: string, team1Id: string, team2Id: string, score1: null, score2: null, completed: false }> }>}
 */
export function generateRoundRobinSchedule(teamIds) {
  if (teamIds.length < 2) {
    return [];
  }

  // Work with a copy so we don't mutate the input.
  const teams = [...teamIds];

  // If odd, push a BYE placeholder.
  const hasBye = teams.length % 2 !== 0;
  if (hasBye) {
    teams.push(null);
  }

  const n = teams.length;
  const totalRounds = n - 1;
  const schedule = [];

  // Fix the first team; rotate the rest.
  const fixed = teams[0];
  const rotating = teams.slice(1);

  for (let r = 0; r < totalRounds; r++) {
    const roundMatches = [];

    // First match: fixed vs the current top of the rotating list.
    const pair1 = [fixed, rotating[0]];
    roundMatches.push(pair1);

    // Remaining matches: pair from opposite ends of the rotating list.
    for (let i = 1; i < n / 2; i++) {
      const team1 = rotating[i];
      const team2 = rotating[rotating.length - i];
      roundMatches.push([team1, team2]);
    }

    // Filter out bye matches (where either team is null).
    const matches = roundMatches
      .filter(([a, b]) => a !== null && b !== null)
      .map(([team1Id, team2Id]) => ({
        id: crypto.randomUUID(),
        team1Id,
        team2Id,
        score1: null,
        score2: null,
        completed: false,
      }));

    schedule.push({ round: r + 1, matches });

    // Rotate: move the last element to the front.
    rotating.unshift(rotating.pop());
  }

  return schedule;
}

/**
 * Distribute teams into groups using a snake-draft order.
 *
 * For example, with 8 teams and 2 groups the assignment order is:
 *   Group A: 1, 4, 5, 8
 *   Group B: 2, 3, 6, 7
 *
 * @param {string[]} teamIds  — assumed to be in seed order (index 0 = top seed)
 * @param {number} numGroups
 * @returns {Array<{ id: string, name: string, teamIds: string[] }>}
 */
export function assignGroups(teamIds, numGroups) {
  const groups = Array.from({ length: numGroups }, (_, i) => ({
    id: `group-${i}`,
    name: `Group ${String.fromCharCode(65 + i)}`,
    teamIds: [],
  }));

  let forward = true;

  for (let i = 0; i < teamIds.length; i++) {
    // Determine which group gets this pick.
    const posInPass = i % numGroups;
    const groupIndex = forward
      ? posInPass
      : numGroups - 1 - posInPass;

    groups[groupIndex].teamIds.push(teamIds[i]);

    // At the end of each pass through all groups, reverse direction.
    if (posInPass === numGroups - 1) {
      forward = !forward;
    }
  }

  return groups;
}

/**
 * Calculate standings from a set of matches.
 *
 * Sorting priority:
 *   1. Wins (descending)
 *   2. Point differential (descending)
 *   3. Points scored (descending)
 *
 * @param {Array<{ team1Id: string, team2Id: string, score1: number, score2: number, completed: boolean }>} matches
 * @param {string[]} teamIds
 * @returns {Array<{ teamId: string, wins: number, losses: number, pointsFor: number, pointsAgainst: number, differential: number }>}
 */
export function calculateStandings(matches, teamIds) {
  const stats = Object.fromEntries(
    teamIds.map((id) => [
      id,
      { teamId: id, wins: 0, draws: 0, losses: 0, points: 0, pointsFor: 0, pointsAgainst: 0, differential: 0 },
    ])
  );

  for (const match of matches) {
    if (!match.completed) continue;

    const { team1Id, team2Id, score1, score2 } = match;

    if (stats[team1Id]) {
      stats[team1Id].pointsFor += score1;
      stats[team1Id].pointsAgainst += score2;
    }
    if (stats[team2Id]) {
      stats[team2Id].pointsFor += score2;
      stats[team2Id].pointsAgainst += score1;
    }

    if (score1 > score2) {
      if (stats[team1Id]) stats[team1Id].wins++;
      if (stats[team2Id]) stats[team2Id].losses++;
    } else if (score2 > score1) {
      if (stats[team2Id]) stats[team2Id].wins++;
      if (stats[team1Id]) stats[team1Id].losses++;
    } else {
      if (stats[team1Id]) stats[team1Id].draws++;
      if (stats[team2Id]) stats[team2Id].draws++;
    }
  }

  const standings = Object.values(stats);
  for (const s of standings) {
    s.differential = s.pointsFor - s.pointsAgainst;
    s.points = s.wins * 3 + s.draws * 1;
  }

  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.differential !== a.differential) return b.differential - a.differential;
    return b.pointsFor - a.pointsFor;
  });

  return standings;
}
